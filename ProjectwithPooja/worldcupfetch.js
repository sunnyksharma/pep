// npm install minimist
// npm install axios
// npm install jsdom
// npm install excel4node
// npm install pdf-lib


// node worldcupfetch.js --excelfile=Poojawc.csv --foldername=teamdetails --url="https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results"

let minimist = require("minimist");
let axios = require("axios");
let jsdom = require("jsdom");
let excel = require("excel4node");
let pdf = require("pdf-lib");
const { fill } = require("pdf-lib");

// Take input
let args = minimist(process.argv);


//extract html from url

let htmlpromise = axios.get(args.url);

htmlpromise.then(function(response){
    let html = response.data;
    
    let dom = new jsdom.JSDOM(html);
    let document = dom.window.document;
    let reqDetais = document.querySelectorAll("div.match-score-block");
    let matches =[];
    for(let i =0; i<reqDetais.length; i++){
        let detail = reqDetais[i];
        let match ={
            team: "",
            opponent: "",
            teamScore: "",
            opponentScore: "",
            result: "",
        };

        let names = detail.querySelectorAll("p.name");
        match.team = names[0].textContent;
        match.opponent = names[1].textContent;

        let Scoresofteams = detail.querySelectorAll("span.score");
        if(Scoresofteams.length==2){
            match.teamScore = Scoresofteams[0].textContent;
            match.opponentScore = Scoresofteams[1].textContent;


        } else if(Scoresofteams.length==1){

            match.teamScore = Scoresofteams[0].textContent;
            match.opponentScore = "Play interrupted";


        } else{
            match.teamScore = "Match abandoned";
            match.opponentScore = "Match abandoned";


        }
        
        match.result = detail.querySelector("div.status-text > span").textContent;
        
        matches.push(match);




    }

    // all details are stored match wise in matches 

    let teams = [];
    populateTeams(teams, matches);
    
    
    let wb = new excel.Workbook();

    let style = wb.createStyle({
        font: {
            color: "blue",
            bold: true,
            size: 13
        }
    })

    for(let i = 0; i<teams.length; i++){
        let SheetName = wb.addWorksheet(teams[i].name);
        fillHeader(style ,SheetName);
        fillContent(SheetName, teams[i].journey);
    }

    wb.write(args.excelfile);

    
    
})

function fillContent(ws, match){
    //console.log(match.length); 
    for (let i = 0; i<match.length; i++){
        //console.log(match[i].vs);
        ws.cell(i+2,1).string(match[i].vs);
        ws.cell(i+2,2).string(match[i].selfScore);
        ws.cell(i+2,3).string(match[i].opponentScore);
        ws.cell(i+2,4).string(match[i].result);
    }    

    
}

function fillHeader(style, ws){
    
    ws.cell(1,1).string("Opponent").style(style);
    ws.cell(1,2).string("Self Score").style(style);
    ws.cell(1,3).string("Opponent Score").style(style);
    ws.cell(1,4).string("Result").style(style);

}

function populateTeams(teams, matches){

    for(let i = 0; i<matches.length; i++){
        let ind = teamExists(teams, matches[i].team)
        if(ind >= 0){
            fillDetails(matches, teams, ind, i);
        } else {
            let team = {
                name: matches[i].team,
                journey: [],
            }
            teams.push(team);
            fillDetails(matches, teams, teams.length-1, i);
        }

        let oind = teamExists(teams, matches[i].opponent);
        if(oind>=0){
            fillDetailsOpponent(matches, teams, oind, i);

        } else{
            let team = {
                name: matches[i].opponent,
                journey: [],
            };
            teams.push(team);
            fillDetailsOpponent(matches, teams, teams.length-1, i);
        }
    }
}

function teamExists(teams, teamname){
    let ind = -1;
    for(let i = 0; i<teams.length; i++){
        if(teams[i].name == teamname){
            //ind = i;
            return i;
        }
    }
    return ind;
}

function fillDetails(matches, teams , ind, i){
    let description ={
        vs: matches[i].opponent,
        selfScore: matches[i].teamScore,
        opponentScore: matches[i].opponentScore,
        result: matches[i].result,
    };
    //console.log(description);
    teams[ind].journey.push(description);
}
function fillDetailsOpponent(matches, teams , ind, i){
    let description ={
        vs: matches[i].team,
        selfScore: matches[i].opponentScore,
        opponentScore: matches[i].teamScore,
        result: matches[i].result,
    };
    //console.log(description);
    teams[ind].journey.push(description);
}