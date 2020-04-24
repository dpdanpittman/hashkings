//                       .                          
//                       M                          
//                      dM                          
//                      MMr                         
//                     4MMML                  .     
//                     MMMMM.                xf     
//     .               "MMMMM               .MM-     
//      Mh..          +MMMMMM            .MMMM      
//      .MMM.         .MMMMML.          MMMMMh      
//       )MMMh.        MMMMMM         MMMMMMM       
//        3MMMMx.     'MMMMMMf      xnMMMMMM"       
//        '*MMMMM      MMMMMM.     nMMMMMMP"        
//          *MMMMMx    "MMMMM\    .MMMMMMM=         
//           *MMMMMh   "MMMMM"   JMMMMMMP           
//             MMMMMM   3MMMM.  dMMMMMM            .
//              MMMMMM  "MMMM  .MMMMM(        .nnMP"
//  =..          *MMMMx  MMM"  dMMMM"    .nnMMMMM*  
//    "MMn...     'MMMMr 'MM   MMM"   .nMMMMMMM*"   
//     "4MMMMnn..   *MMM  MM  MMP"  .dMMMMMMM""     
//       ^MMMMMMMMx.  *ML "M .M*  .MMMMMM**"        
//          *PMMMMMMhn. *x > M  .MMMM**""           
//             ""**MMMMhx/.h/ .=*"                  
//                      .3P"%....                   
//                    nP"     "*MMnx       DaFreakyG

var steem = require('dsteem');
var steemjs = require('steem');
var steemState = require('./processor');
var steemTransact = require('steem-transact');
var fs = require('fs');
const cors = require('cors');
const express = require('express')
const ENV = process.env;
const maxEx = process.max_extentions || 8;
const IPFS = require('ipfs-http-client');
const ipfs = new IPFS({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https'
});

/*  const init holds the initial state of a user in the form of a json 
    as shown in the example.

        const init: {
            "delegations": {
                "delegator": string;
                "vests": number;
                "available": number;
                "used": number;
            }[];
            "kudos": {};
            "stats": {
                "vs": number;
                "dust": number;
                "time": number;
                "offsets": {
                    "a": number;
                    "b": number;
                    "c": number;
                    "d": number;
                    "e": number;
                    "f": number;
                };
                ... 5 more ...;
                "gardeners": number;
            };
            ... 8 more ...;
            "cs": {
                 ...;
            };
        }

*/
const init = require('./state');

const app = express();
const port = ENV.PORT || 3000;
const wkey = ENV.wkey;
const skey = steem.PrivateKey.from(ENV.skey);
const streamname = ENV.streamname;

app.use(cors());

/*plot info from state.js by plot number
            {
            "owner": "qwoyn",
            "strain": "",
            "xp": 0,
            "care": [
                [
                    39562272,
                    "watered"
                ],
                [
                    39533519,
                    "watered"
                ],
                [
                    39504770,
                    "watered",
                    "c"
                ]
            ],
            "aff": [],
            "stage": -1,
            "substage": 0,
            "traits": [],
            "terps": [],
            "id": "a10"
            }
*/
app.get('/p/:addr', (req, res, next) => {
    let addr = req.params.addr
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(state.land[addr], null, 3))
});

//shows a log 
app.get('/logs', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(state.cs, null, 3))
});

/*detailed list of seeds a user owns from state.js by username\
        [
        {
            "owner": "qwoyn",
            "strain": "",
            "xp": 0,
            "care": [
                [
                    39562272,
                    "watered"
                ],
                [
                    39533519,
                    "watered"
                ],
                [
                    39504770,
                    "watered",
                    "c"
                ]
            ],
            "aff": [],
            "stage": -1,
            "substage": 0,
            "traits": [],
            "terps": [],
            "id": "a10"
        },
        {
            "owner": "qwoyn",
            "strain": "hk",
            "xp": 2250,
            "care": [
                [
                    39562272,
                    "watered"
                ],
                [
                    39533519,
                    "watered",
                    "c"
                ],
                [
                    39504770,
                    "watered",
                    "c"
                ]
            ],
            "aff": [],
            "planted": 33012618,
            "stage": 5,
            "substage": 3,
            "id": "c46",
            "sex": null
        },
        {
            "owner": "qwoyn",
            "strain": "mis",
            "xp": 1,
            "care": [
                [
                    39562272,
                    "watered"
                ],
                [
                    39533519,
                    "watered",
                    "c"
                ],
                [
                    39445948,
                    "watered",
                    "c"
                ]
            ],
            "aff": [],
            "planted": 35387927,
            "stage": 5,
            "substage": 1,
            "id": "a77",
            "sex": null
        },
        "a100"
        ]
*/
app.get('/a/:user', (req, res, next) => {
    let user = req.params.user, arr = []
    res.setHeader('Content-Type', 'application/json');
    if(state.users[user]){
        for (var i = 0 ; i < state.users[user].addrs.length ; i++){
            arr.push(state.users[user].addrs[i])
        }
    }
    for ( var i = 0 ; i < arr.length ; i++){
        insert = ''
        var insert = state.land[arr[i]]
        if(insert){
            insert.id = arr[i]
            if(insert.care.length>3){insert.care.splice(3,insert.care.length-3)}
            if(insert.aff.length>3){insert.aff.splice(3,insert.aff.length-3)}
            arr.splice(i,1,insert)
        }
    }
    res.send(JSON.stringify(arr, null, 3))
});

//overal game stats i.e. number of gardeners, number of plants available, seed prices, land price, weather info
//at each location such as mexico or jamaica etc.
app.get('/stats', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    Object.keys(state.users).length
    var ret = state.stats
    ret.gardeners = Object.keys(state.users).length
    res.send(JSON.stringify(ret, null, 3))
});

//entire state.json output
app.get('/', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(state, null, 3))
});

//market output
app.get('/market', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(state.market, null, 3))
});

//shows seeds by user
app.get('/seeds/:user', (req, res, next) => {
    let user = req.params.user, arr = []
    res.setHeader('Content-Type', 'application/json');
    if(state.users[user]){
        for (var i = 0 ; i < state.users[user].seeds.length ; i++){
            arr.push(state.users[user].seeds[i])
        }
    }
    res.send(JSON.stringify(arr, null, 3))
});

//shows pollen by user
app.get('/pollen/:user', (req, res, next) => {
    let user = req.params.user, arr = []
    res.setHeader('Content-Type', 'application/json');
    if(state.users[user]){
        for (var i = 0 ; i < state.users[user].pollen.length ; i++){
            arr.push(state.users[user].pollen[i])
        }
    }
    res.send(JSON.stringify(arr, null, 3))
});

//shows buds by user
app.get('/buds/:user', (req, res, next) => {
    let user = req.params.user, arr = []
    res.setHeader('Content-Type', 'application/json');
    if(state.users[user]){
        for (var i = 0 ; i < state.users[user].buds.length ; i++){
            arr.push(state.users[user].buds[i])
        }
    }
    res.send(JSON.stringify(arr, null, 3))
});

//post payouts in que
app.get('/refunds', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        refunds: state.refund,
        bal: state.bal
    }, null, 3))
});

/*plot and seed information by user
        {
        "addrs": [
            "a10",
            "c46",
            "a77",
            "a100"
        ],
        "seeds": [
            {
                "strain": "kbr",
                "xp": 2250,
                "traits": [
                    "beta"
                ]
            },
            {
                "strain": "kbr",
                "xp": 2250,
                "traits": [
                    "beta"
                ]
            },
            {
                "xp": 50
            }
        ],
        "inv": [],
        "stats": [],
        "v": 0
        }

*/
app.get('/u/:user', (req, res, next) => {
    let user = req.params.user
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(state.users[user], null, 3))
});

/*delegation information by user
{
   "delegator": "qwoyn",
   "vests": 4900485891391,
   "available": 123,
   "used": 2
}
*/
app.get('/delegation/:user', (req, res, next) => {
    let user = req.params.user
    var op = {}
    for(i=0;i<state.delegations.length;i++){
        if(state.delegations[i].delegator == user){
            op = state.delegations[i]
            break;
        }
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(op, null, 3))
});

app.listen(port, () => console.log(`HASHKINGS token API listening on port ${port}!`))
var state;
var startingBlock = ENV.STARTINGBLOCK || 42789519; //GENESIS BLOCK
const username = ENV.ACCOUNT || 'hashkings'; //account with all the SP
const key = steem.PrivateKey.from(ENV.KEY); //active key for account
const sh = ENV.sh || '';
const ago = ENV.ago || 42789519;
const prefix = ENV.PREFIX || 'qwoyn_'; // part of custom json visible on the blockchain during watering etc..
const clientURL = ENV.APIURL || 'https://api.steemit.com/' // can be changed to another node
var client = new steem.Client(clientURL);
var processor;
var recents = [];
const transactor = steemTransact(client, steem, prefix);

/****ISSUE****/
//I think this is where the app can get the hash from hashkings_report that is saved in state.js and use it
//to start the app.  this should prevent the app having to start from GENESIS BLOCK
steemjs.api.getAccountHistory(username, -1, 100, function(err, result) {
  if (err){
    console.log(err)
    startWith(sh)
  } else {
    let ebus = result.filter( tx => tx[1].op[1].id === 'qwoyn_report' )
    for(i=ebus.length -1; i>=0; i--){
      if(JSON.parse(ebus[i][1].op[1].json).stateHash !== null)recents.push(JSON.parse(ebus[i][1].op[1].json).stateHash)
    }
    const mostRecent = recents.shift()
    console.log('starting properly')
    console.log(sh)
    console.log(mostRecent)
    startWith(mostRecent)
  }
});

//assigns kudos to user. kudos determine who has properly cared for their plants and 
//increments kudos accordingly
function kudo(user) {
    console.log('Kudos: ' + user)
    if (!state.kudos[user]) {
        state.kudos[user] = 1
    } else {
        state.kudos[user]++
    }
}

/****ISSUE****/
function startWith(hash) {
    if (hash) {
        console.log(`Attempting to start from IPFS save state ${hash}`);
        ipfs.cat(hash, (err, file) => {
            if (!err) {
                var data = JSON.parse(file.toString())
                startingBlock = data[0]
                if (startingBlock == ago){startWith(hash)}
                else {
                state = JSON.parse(data[1]);
                startApp();
                }
            } else {
                const mostRecent = recents.shift()
                console.log('Attempting start from:'+mostRecent)
                startWith(mostRecent)
            }
        });
    } else {
        console.log('Didnt start with hash')
        state = init
        startApp()
    }
}

function startApp() {
  if(state.cs == null) {
    state.cs = {}
  }
    processor = steemState(client, steem, startingBlock, 10, prefix);


    processor.onBlock(function(num, block) {
        const sun = (num - state.stats.time) % 28800
        var td = []
        for (var o in state.stats.offsets) {
            if (sun - state.stats.offsets[o] < 1200 && sun - state.stats.offsets[o] > 0) {
                td.push(`${o}${((sun-state.stats.offsets[o])*4)}`, `${o}${((sun-state.stats.offsets[o])*4)-1}`, `${o}${((sun-state.stats.offsets[o])*4)-2}`, `${o}${((sun-state.stats.offsets[o])*4)-3}`);
            }
            if (sun - state.stats.offsets[o] == 1200) {
               popWeather(o).then((r)=>{console.log(r);/*autoPoster(r,num)*/}).catch((e)=>{console.log(e)})
            }
            if (sun - state.stats.offsets[o] == 1500) {
               //state.refund.push(['sign',[["vote",{"author":streamname,"permlink":`h${num-300}`,"voter":username,"weight":10000}]]])
            }
        }
        for (var i = 0; i < td.length; i++) {
            daily(td[i])
        }
        if (num % 125 === 0 && state.refund.length && processor.isStreaming() || processor.isStreaming() && state.refund.length > 60) {
            if (state.refund[0].length == 4) {
                bot[state.refund[0][0]].call(this, state.refund[0][1], state.refund[0][2], state.refund[0][3])
            } else if (state.refund[0].length == 3){
                bot[state.refund[0][0]].call(this, state.refund[0][1], state.refund[0][2])
            } else if (state.refund[0].length == 2) {
                var op = true, bens = false
                try {
                    if (state.refund[1][1] == 'comment_options') op = false
                    if (state.refund[1][1].extentions[0][1].beneficiaries.length) bens = true
                } catch (e) {
                    console.log('not enough players', e.message)
                }
                if(op || bens){bot[state.refund[0][0]].call(this, state.refund[0][1])} else {
                    state.refund.shift()
                }
            }
        }
        if (num % 100 === 0 && !processor.isStreaming()) {
            if(!state.news.e)state.news.e=[]
            client.database.getDynamicGlobalProperties().then(function(result) {
                console.log('At block', num, 'with', result.head_block_number - num, 'left until real-time.')
            });
        }

        if (num % 1000 === 0 && processor.isStreaming()) {
            if(!state.blacklist)state.blacklist={}
            ipfsSaveState(num, JSON.stringify(state))
        }

        if (num % 28800 === 20000 && state.payday.length) {
            for (var item in state.cs){
              if(item.split(':')[0] < num - 28800 || item.split(':')[0] == 'undefined'){
                delete state.cs[item]
              }
            }
            state.payday[0] = sortExtentions(state.payday[0],'account')
        var body = `\n`
        var footer = `\n`  //edits
            if (state.news.h.length > 0){
                body = body + state.news.h[0] + footer ;state.news.h.shift();
            } else {
                body = body + footer
            }
            body = body + listBens(state.payday[0])
            /* post edit
            state.refund.push(['ssign',[["comment",
                                 {"parent_author": "",
                                  "parent_permlink": 'hashkings',
                                  "author": streamname,
                                  "permlink": 'h'+num,
                                  "title": `Farmers Guide | ${num}`,
                                  "body": body,
                                  "json_metadata": JSON.stringify({tags:["hashkings"]})}],
                                ["comment_options",
                                 {"author": streamname,
                                  "permlink": 'h'+num,
                                  "max_accepted_payout": "1000000.000 SBD",
                                  "percent_steem_dollars": 10000,
                                  "allow_votes": true,
                                  "allow_curation_rewards": true,
                                  "extensions":
                                  [[0,
                                    {"beneficiaries":state.payday[0]}]]}]] ])*/
            state.payday.shift()
    }
        /*if (num % 28800 === 20300 && state.payday && state.payday[0].length) {
            state.refund.push(['sign',[["vote",{"author":streamname,"permlink":`h${num-300}`,"voter":username,"weight":10000}]]])
        }
        if (num % 28800 === 25000 && state.payday.length) {

            state.payday[0] = sortExtentions(state.payday[0],'account')
            var body = `\n`
            if (state.news.i.length > 0){
                body = body + state.news.i[0] + footer ;state.news.i.shift();
            } else {
                body = body + footer
            }
            body = body + listBens(state.payday[0])
            
            state.refund.push(
                              ['ssign',
                                [
                                 ["comment",
                                  {
                                      "parent_author": "",
                                      "parent_permlink": 'hashkings',
                                      "author": streamname,
                                      "permlink": 'h'+num,
                                      "title": `Farmers Guide | ${num}`,
                                      "body": body,
                                      "json_metadata": JSON.stringify({tags:["hashkings"]})
                                   }
                                  ],
                                    ["comment_options",
                                      {
                                          "author": streamname,
                                          "permlink": 'h'+num,
                                          "max_accepted_payout": "1000000.000 SBD",
                                          "percent_steem_dollars": 10000,
                                          "allow_votes": true,
                                          "allow_curation_rewards": true,
                                          "extensions":
                                        [[0,{"beneficiaries":state.payday[0]}]]}]]])
            state.payday.shift()
    }*/
       /* if (num % 28800 === 25300 && state.payday && state.payday.length) {
    state.refund.push(['sign',[["vote",{"author":streamname,"permlink":`h${num-300}`,"voter":username,"weight":10000}]]])
    }
        if (num % 28800 === 22000 && state.payday[0].length) {
            state.payday[0] = sortExtentions(state.payday[0],'account')
        var body = `\n`
            if (state.news.t.length > 0){
                body = body + state.news.t[0] + footer ;state.news.t.shift();
            } else {
                body = body + footer
            }
            body = body + listBens(state.payday[0])
            state.refund.push(['ssign',[["comment",
                                 {"parent_author": "",
                                  "parent_permlink": 'hashkings',
                                  "author": streamname,
                                  "permlink": 'h'+num,
                                  "title": `Farmers Guide | ${num}`,
                                  "body": body,
                                  "json_metadata": JSON.stringify({tags:["hashkings"]})}],
                                ["comment_options",
                                 {"author": streamname,
                                  "permlink": 'h'+num,
                                  "max_accepted_payout": "1000000.000 SBD",
                                  "percent_steem_dollars": 10000,
                                  "allow_votes": true,
                                  "allow_curation_rewards": true,
                                  "extensions":
                                  [[0,
                                    {"beneficiaries":state.payday[0]}]]}]] ])
            state.payday.shift()
    }*/
    /*if (num % 28800 === 22300) {
    state.refund.push(['sign',[["vote",{"author":streamname,"permlink":`h${num-300}`,"voter":username,"weight":10000}]]])
    }
        if (num % 28800 === 28750) {
            state.payday = whotopay()
        }*/
        if (num % 28800 === 0) {
            var d = parseInt(state.bal.c / 4)
            state.bal.r += state.bal.c
            if (d) {
                state.refund.push(['xfer', 'qwoyn-dev', d, 'Dev Cut'])
                state.refund.push(['xfer', 'qwoyn-fund', parseInt(2 * d), 'Funds'])
                state.refund.push(['xfer', 'qwoyn', d, 'Producer Cut'])
                state.bal.c -= d * 4
                d = parseInt(state.bal.c / 5) * 2
                //state.refund.push(['xfer', 'qwoyn-chest', state.bal.c, 'Warchest'])
                state.bal.c = 0
                state.refund.push(['power', username, state.bal.b, 'Power to the people!'])
            }
    }
  })

//----------------------------------------------------------------------------------------
//
//===========================================
//                                          |
//         ****Hashkings Market****         |
//                                          |
//===========================================


//---------posting sales-----------//
// https://beta.steemconnect.com/sign/custom-json?required_auths=%5B%5D&required_posting_auths=%5B%22qwoyn%22%5D&id=qwoyn_market_post_seed&json=%7B%22price%22%3A%5B5000%5D,%22seed%22%3A%5B%22mis%22%5D%7D
processor.on('market_post_seed', function(json, from) {
    let seed = json.seed,
        seednames = ''
    let price = json.price,
        sellerName = ''

        const postedToMarket = {
            [from]: [
                {
                [seed]: [
                    {
                        price:  json.price,
                        posted: json.block_num
                    }
                ]
                }
            ]
        }
        state.market.seeds.push(postedToMarket);

        const postedForSale = {
            TEST: true
        }
        for(i = 0; i = 1; i++) {
        state.users[from].seeds.seed[i].push(postedForSale)
        console.log(state.users[from].seeds.seed[i].TEST)
        }

   /* try {
        for (var i = 0; i < seed.length; i++) {   
        try {
            if (state.users[from].seeds[seed[i]].owner === from) {
                state.users[from].seeds[seed[i]].forSale = true;
                seednames += `${seed[i]} `;
            }
        } catch (e){
        state.cs[`${json.block_num}:${from}`] = `${from} can't post what is not theirs`
        }
        }
    } catch {
        (console.log(from + ' tried to post a ' + seednames +' seed for sale but an error occured'))
    }*/

    state.cs[`${json.block_num}:${from}`] = `${from} succesfully posted a ${json.seed} seed for sale for ${json.price} STEEM`
});

processor.on('market_post_pollen', function(json, from) {
    let pollen = json.pollen,
        pollennames = ''
        try {
        for (var i = 0; i < pollen.length; i++) {
            try {
            if (state.users.from[pollen[i]].owner === from && state.users.from[pollen[i]].forSale === 0) {
                state.users.from[pollen[i]].forSale = 1;
                pollennames += `${pollen[i]} `
            }
            } catch (e){
            state.cs[`${json.block_num}:${from}`] = `${from} can't post what is not theirs`
            }
        }
        } catch {
            (console.log(from + ' tried to post ' + pollennames +' pollen for sale but an error occured'))
        }
    state.cs[`${json.block_num}:${from}`] = `${from} succesfully posted ${pollennames} pollen for sale`
});

processor.on('market_post_buds', function(json, from) {
    let buds = json.buds,
        budNames = ''
        try {
        for (var i = 0; i < buds.length; i++) {
            try {
            if (state.users.from[buds[i]].owner === from && state.users.from[buds[i]].forSale === 0) {
                state.users.from[buds[i]].forSale = 1;
                budNames += `${buds[i]} `
            }
            } catch (e){
            state.cs[`${json.block_num}:${from}`] = `${from} can't post what is not theirs`
            }
        }
        } catch {
            (console.log(from + ' tried to post a ' + budNames +' bud for sale but an error occured'))
        }
    state.cs[`${json.block_num}:${from}`] = `${from} succesfully posted a ${budNames} bud for sale`
});

//---------cancel sales-----------//

processor.on('market_cancel_seed', function(json, from) {
    let seeds = json.seeds,
        seednames = ''
        try {
        for (var i = 0; i < seeds.length; i++) {
            try {
            if (state.users.from[seeds[i]].owner === from) {
                state.users.from[seeds[i]].forSale = 0;
                seednames += `${seeds[i]} `
            }
            } catch (e){
            state.cs[`${json.block_num}:${from}`] = `${from} can't post what is not theirs`
            }
        }
        } catch {
            (console.log(from + ' tried to post a ' + seednames +' for sale but an error occured'))
        }
    state.cs[`${json.block_num}:${from}`] = `${from} succesfully posted a ${seednames} seed for sale`
});

processor.on('market_cancel_pollen', function(json, from) {
    let pollen = json.pollen,
        pollennames = ''
        try {
        for (var i = 0; i < pollen.length; i++) {
            try {
            if (state.users.from[pollen[i]].owner === from) {
                state.users.from[pollen[i]].forSale = 0;
                pollennames += `${pollen[i]} `
            }
            } catch (e){
            state.cs[`${json.block_num}:${from}`] = `${from} can't post what is not theirs`
            }
        }
        } catch {
            (console.log(from + ' tried to post ' + pollennames +' pollen for sale but an error occured'))
        }
    state.cs[`${json.block_num}:${from}`] = `${from} succesfully posted ${pollennames} pollen for sale`
});

processor.on('market_cancel_buds', function(json, from) {
    let buds = json.buds,
        budNames = ''
        try {
        for (var i = 0; i < buds.length; i++) {
            try {
            if (state.users.from[buds[i]].owner === from) {
                state.users.from[buds[i]].forSale = 0;
                budNames += `${buds[i]} `
            }
            } catch (e){
            state.cs[`${json.block_num}:${from}`] = `${from} can't post what is not theirs`
            }
        }
        } catch {
            (console.log(from + ' tried to post a ' + budNames +' bud for sale but an error occured'))
        }
    state.cs[`${json.block_num}:${from}`] = `${from} succesfully posted a ${budNames} bud for sale`
});

//--------purchasing----------//
// found on line 2825

//---------------------End Market---------------------------------------------------------
    
// search for qwoyn_harvest from user on blockchain since genesis
    processor.on('harvest', function(json, from) {
        let plants = json.plants,
            plantnames = ''

        for (var i = 0; i < plants.length; i++) {
            try {
            if (state.land[plants[i]].owner === from) {
                state.land[plants[i]].care.unshift([processor.getCurrentBlockNumber(), 'harvested']);
                plantnames += `${plants[i]} `
            
        //female harvested pollinated plant
            try {
            if (state.land[plants[i]].sex === 'female' && state.land[plants[i]].pollinated === true && state.land[plants[i]].stage > 3){
                var harvestedSeed = {
                    strain: state.land[plants[i]].strain,
                    owner: state.land[plants[i]].owner,
                    traits: ['beta pollinated seed'],
                    terps: [],
                    thc: 'coming soon',
                    cbd: 'coming soon',
                    breeder: state.land[plants[i]].owner,
                    familyTree: state.land[plants[i]].strain + ' ' + state.land[plants[i]].father,
                    pollinated: false,
                    father: [],
                }
                var harvestedSeed2 = {
                    strain: state.land[plants[i]].strain,
                    owner: state.land[plants[i]].owner,
                    traits: ['beta pollinated seed'],
                    terps: [],
                    thc: 'coming soon',
                    cbd: 'coming soon',
                    familyTree: state.land[plants[i]].strain + ' ' + state.land[plants[i]].father,
                    pollinated: false,
                    father: [],
                }

                const parcel = {
                    owner: state.land[plants[i]].owner,
                    strain: '',
                    xp: 0,
                    care: [[processor.getCurrentBlockNumber(),'tilled']],
                    aff: [],
                    stage: -1,
                    substage: 0,
                    traits: [],
                    terps: [],
                    stats: [],
                    pollinated: false
                }

                state.land[plants[i]] = parcel;
                kudo(state.land[plants[i]].owner);

                state.users[state.land[plants[i]].owner].seeds.push(harvestedSeed)
                state.users[state.land[plants[i]].owner].seeds.push(harvestedSeed2)
                state.users[state.land[plants[i]].owner].xps += 25;
                
            }
            } catch(e) {
                console.log('', e.message)
                }
                
                //harvest buds if female not pollinated
                try {
                if (state.land[plants[i]].sex === 'female' && state.land[plants[i]].pollinated === false && state.land[plants[i]].stage > 3){                
                    var bud1 = {
                        strain: state.land[plants[i]].strain,
                        owner: state.land[plants[i]].owner,
                        traits: ['Beta Buds'],
                        terps: [state.land[plants[i]].strain.terps],
                        thc: 'coming soon',
                        cbd: 'coming soon',
                        familyTree: state.land[plants[i]].strain + ' ' + state.land[plants[i]].father,
                        father: 'Sensimilla'
                    }
                    var bud2 = {
                        strain: state.land[plants[i]].strain,
                        owner: state.land[plants[i]].owner,
                        traits: ['Beta Buds'],
                        thc: 'coming soon',
                        cbd: 'coming soon',
                        terps: [state.land[plants[i]].strain.terps],
                        familyTree: state.land[plants[i]].strain + ' ' + state.land[plants[i]].father,
                        father: 'Sensimilla'
                    }

                    const parcel = {
                        owner: state.land[plants[i]].owner,
                        strain: '',
                        care: [[processor.getCurrentBlockNumber(),'tilled']],
                        aff: [],
                        stage: -1,
                        substage: 0,
                        traits: [],
                        terps: [],
                        stats: [],
                        pollinated: false
                    }
                    state.land[plants[i]] = parcel;
                    kudo(state.land[plants[i]].owner);

                    state.users[state.land[plants[i]].owner].buds.push(bud1)
                    state.users[state.land[plants[i]].owner].buds.push(bud2)
                    state.users[state.land[plants[i]].owner].xps += 25;
                    
                    }
                    } catch(e) {
                        console.log('buds harvested', e.message)
                    }
                    

            //pollen at harvest if male
            try {
            if (state.land[plants[i]].sex === 'male' && state.land[plants[i]].stage > 3){
                var pollen1 = {
                    strain: state.land[plants[i]].strain,
                    owner: state.land[plants[i]].owner,
                    traits: ['Beta Pollen'],
                    terps: [],
                    thc: 'coming soon',
                    cbd: 'coming soon',
                    familyTree: state.land[plants[i]].strain + ' ' + state.land[plants[i]].father,
                    father: 'Sensimilla'
                }
                var pollen2 = {
                    strain: state.land[plants[i]].strain,
                    owner: state.land[plants[i]].owner,
                    traits: ['Beta Pollen'],
                    terps: [],
                    thc: 'coming soon',
                    cbd: 'coming soon',
                    familyTree: state.land[plants[i]].strain + ' ' + state.land[plants[i]].father,
                    father: 'Sensimilla'
                }

                const parcel = {
                    owner: state.land[plants[i]].owner,
                    strain: '',
                    xp: 0,
                    care: [[processor.getCurrentBlockNumber(),'tilled']],
                    aff: [],
                    terps: [],
                    stats: [],
                    stage: -1,
                    substage: 0,
                    pollinated: false
                }
                state.land[plants[i]] = parcel;
                kudo(state.land[plants[i]].owner);
                
                state.users[state.land[plants[i]].owner].pollen.push(pollen1)
                state.users[state.land[plants[i]].owner].pollen.push(pollen2)
                state.users[state.land[plants[i]].owner].xps += 25;
                
            }
            } catch(e) {
                console.log('pollen harvested', e.message)
                }
            }
        } catch (e){
          state.cs[`${json.block_num}:${from}`] = `${from} can't harvest what is not theirs`
        }
            }
        state.cs[`${json.block_num}:${from}`] = `${from} harvested ${plantnames}`
    });
    
    // search for qwoyn_water from user on blockchain since genesis
    //steemconnect link
    //https://app.steemconnect.com/sign/custom-json?required_auths=%5B%5D&required_posting_auths=%5B%22USERNAME%22%5D&id=qwoyn_water&json=%7B%22plants%22%3A%5B%22c35%22%5D%7D
    processor.on('water', function(json, from) {
        let plants = json.plants,
            plantnames = ''
            try {
            for (var i = 0; i < plants.length; i++) {
                try {
                if (state.land[plants[i]].owner === from) {
                    state.land[plants[i]].care.unshift([processor.getCurrentBlockNumber(), 'watered']);
                    plantnames += `${plants[i]} `
                }
                } catch (e){
                state.cs[`${json.block_num}:${from}`] = `${from} can't water what is not theirs`
                }
            }
            } catch {
                (console.log(from + ' tried to water ' + plantnames +' but an error occured'))
            }
        state.cs[`${json.block_num}:${from}`] = `${from} succesfully watered ${plantnames}`
    });
    
    //search for qwoyn_breeder_name from user on blockchain since genesis
    //steemconnect link
    //https://beta.steemconnect.com/sign/custom-json?required_auths=%5B%5D&required_posting_auths=%5B%22USERNAME%22%5D&id=qwoyn_breeder_name&json=%7B%22breeder%22%3A%5B%22Willie%22%5D%7D
    processor.on('breeder_name', function(json, from) {
        let breeder = json.breeder,
            breederName = ''
            try {
                for (var i = 0; i < 1; i++) {
                        state.users[from].breeder = breeder[i];
                        breederName += `${breeder[i]}`
                    state.cs[`${json.block_num}:${from}`] = `${from} can't change another users name`
                } 
            } catch {
                (console.log(from + ' tried to change their breeder name to ' + breederName + ' but an error occured'))
            }
        
        state.cs[`${json.block_num}:${from}`] = `${from} changed their breeder name to ${breederName}`
    });

    //search for qwoyn_farmer_type from user on blockchain since genesis
    //steemconnect link
    //https://beta.steemconnect.com/sign/custom-json?required_auths=%5B%5D&required_posting_auths=%5B%22USERNAME%22%5D&id=qwoyn_farmer_type&json=%7B%22breeder%22%3A%5B%22TYPE%22%5D%7D
    processor.on('farmer_type', function(json, from) {
        let farmer = json.farmer,
            farmerType = 1
            try {
                for (var i = 0; i < 1; i++) {
                        state.users[from].farmer = farmer[i];
                        farmerType += farmer[i]
                    state.cs[`${json.block_num}:${from}`] = `${from} can't change another users name`
                }
             } catch {
            (console.log(from + ' tried to change their farmyer type to ' + farmerType + ' but an error occured'))
        }
        //state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'changed_farmer_type']);

        state.cs[`${json.block_num}:${from}`] = `${from} changed their breeder name to ${farmerType}`
    });

    //search for qwoyn_add_friend from user on blockchain since genesis
    //steemconnect link
    //https://beta.steemconnect.com/sign/custom-json?required_auths=%5B%5D&required_posting_auths=%5B%22qwoyn%22%5D&id=qwoyn_add_friend&json=%7B%22friend%22%3A%5B%22jonyoudyer%22%5D%7D
    processor.on('add_friend', function(json, from) {
        let friend = json.friend,
            friendName = ''
            try {
            for (var i = 0; i < 1; i++) {
                friendName += friend[i]

                var friends = {
                    name: friend,
                    alliance: state.users[friend].alliance,
                    addedOn: json.block_num,
                }

                state.users[from].friends.push(friends)
                //state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'added_friend']);

                state.cs[`${json.block_num}:${from}`] = `${from} can't change another users friend list`
            }
        } catch {
            (console.log(from + ' tried to add ' + friendName + ' as a friend but an error occured'))
        }

        state.cs[`${json.block_num}:${from}`] = `${from} added ${friendName} as a friend`
    });

    //search for qwoyn_remove_friend from user on blockchain since genesis
    //steemconnect link
    //https://beta.steemconnect.com/sign/custom-json?required_auths=%5B%5D&required_posting_auths=%5B%22USERNAME%22%5D&id=qwoyn_join_alliance&json=%7B%22alliance%22%3A%5B%22NAMEOFALLIANCE%22%5D%7D
    processor.on('remove_friend', function(json, from) {
        let friend = json.friend,
            friendName = ''
            try{
                for (var i = 0; i < 1; i++) {
                    friendName += friend[i]

                    var friends = ''

                        try{
                            for (var i = 0;i < state.users[from].friends.length; i++){
                                if(state.users[from].pollen[i].strain == json.friends){friends=state.users[from].friends.splice(i, 1)[0];break;}
                            }
                        } catch (e) {}
                        if (!friends){
                            try {
                                if(state.users[from].friends.length)friends == state.users[from].friends.splice(0, 1)[0]
                            }catch (e) {}
                        }
                    state.cs[`${json.block_num}:${from}`] = `${from} can't change another users friend list`
                }
            } catch {
                (console.log(from + ' tried to remove ' + friendName + ' as a friend but an error occured'))    }

        state.cs[`${json.block_num}:${from}`] = `${from} removed ${friendName} as a friend`
    });

    //****ISSUE****//
    //search for qwoyn_join_alliance from user on blockchain since genesis
    //steemconnect link
    //https://beta.steemconnect.com/sign/custom-json?required_auths=%5B%5D&required_posting_auths=%5B%22USERNAME%22%5D&id=qwoyn_join_alliance&json=%7B%22alliance%22%3A%5B%22NAMEOFALLIANCE%22%5D%7D
   processor.on('join_alliance', function(json, from) {
        let alliance = json.alliance,
            allianceName = ''
            try {
        for (var i = 0; i < state.stats.alliances.length; i++) {
                state.users[from].alliance = alliance[i];
                allianceName += alliance[i]

                try{
                    for (var i = 0; i < state.users[from].alliance.length; i++){
                        var myAlliance = {
                            alliance: json.alliance
                        }
                        // not properly updating the name
                        if(state.users[from].alliance[i] != json.alliance){state.users[from].alliance = myAlliance;break;}
                        var newMember = json.from
                        if(state.users[from].alliance[i] == json.alliance){state.stats.alliances[alliance].push(newMember);break;}
                    }
                } catch (e) {}

            state.cs[`${json.block_num}:${from}`] = `${from} can't change another users alliance`
        }
    } catch {
        (console.log(from + ' tried to join the ' + allianceName + ' alliance but an error occured'))
    }
        //state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'joined_alliance']);

        state.cs[`${json.block_num}:${from}`] = `${from} changed their alliance to ${allianceName}`
    });

    //search for qwoyn_alliance from user on blockchain since genesis
    //steemconnect link
    //https://beta.steemconnect.com/sign/custom-json?required_auths=%5B%5D&required_posting_auths=%5B%22USERNAME%22%5D&id=qwoyn_create_alliance&json=%7B%22newAlliance%22%3A%5B%22NAMEOFALLIANCE%22%5D%7D
    processor.on('create_alliance', function(json, from) {
        let newAlliance = json.newAlliance,
            newAllianceName = ''
        for (var i = 0; i < 1; i++) {
                newAllianceName += newAlliance[i]
                var allianceState = {
                    name: newAlliance,
                    founder: from,
                    members: 1,
                    memberNames: [from],
                }
                state.stats.alliances.push(allianceState)
                //state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'created_alliance']);

            state.cs[`${json.block_num}:${from}`] = `${from} can't create an alliance`
        }
        state.cs[`${json.block_num}:${from}`] = `${from} created alliance named ${newAllianceName}`
    });

    // search for qwoyn_pollinate from user on blockchain since genesis
    processor.on('pollinate', function(json, from) {
        let plants = json.plants,
            plantnames = '',
            pollen = json.pollen,
            pollenName = ''
        for (var i = 0; i < 1; i++) {
            try {
            if (state.land[plants].owner === from && state.land[plants].stage > 2 && state.users[from].pollen) {
                state.land[plants].care.unshift([processor.getCurrentBlockNumber(), 'pollinated']);
                plantnames += `${plants}`;
                pollenName += `${pollen}`;
             
                var pollens = ''

                try{
                    for (var i = 0;i < state.users[from].pollen.length; i++){
                        if(state.users[from].pollen[i].strain == json.pollen){pollens=state.users[from].pollen.splice(i, 1)[0];break;}
                    }
                } catch (e) {}
                if (!pollens){
                    try {
                        if(state.users[from].buds.length)pollens == state.users[from].pollen.splice(0, 1)[0]
                    }catch (e) {}
                }

                state.land[plants].pollinated = true;
                state.land[plants].father = pollenName;       
            }
            } catch (e){
              state.cs[`${json.block_num}:${from}`] = `${from} can't pollinate what is not theirs`
            }
        }
        state.cs[`${json.block_num}:${from}`] = `${from} pollinated ${plantnames} with ${pollenName}`
        
        return pollenName;
    });

    // search for qwoyn_craft_oil from user on blockchain since genesis
    processor.on('craft_bubblehash', function(json, from) {
        let buds = json.buds,
            budNames = '',
            dateCreated = json.block_num
        var bud = ''

            try{
                for (var i = 0;i < state.users[from].buds.length; i++){
                    if(state.users[from].buds[i].strain == json.buds){bud=state.users[from].buds.splice(i, 1)[0];break;}
                }
            } catch (e) {}
            if (!bud){
                try {
                    if(state.users[from].buds.length)bud == state.users[from].buds.splice(0, 1)[0]
                }catch (e) {}
            }

        for (var i = 0; i < 1; i++) {
                //state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'crafted_bubblehash']);
                budNames += `${buds}`;
             
                state.users[from].bubblebags--;

                var bubblehash = {
                    strain: buds,
                    createdBy: from,
                    createdOn: dateCreated
                }

                state.users[from].bubblehash.push(bubblehash)

        }
        state.cs[`${json.block_num}:${from}`] = `${from} created bubblehash with ${budNames}`
    });

    // search for qwoyn_craft_oil from user on blockchain since genesis
    processor.on('craft_oil', function(json, from) {
        let buds = json.buds,
            budNames = '',
            dateCreated = json.block_num
        var bud = ''

            try{
                for (var i = 0;i < state.users[from].buds.length; i++){
                    if(state.users[from].buds[i].strain == json.buds && state.users[from].xps > 999){bud=state.users[from].buds.splice(i, 1)[0];break;}
                }
            } catch (e) {}
            if (!bud){
                try {
                    if(state.users[from].buds.length)bud == state.users[from].buds.splice(0, 1)[0]
                }catch (e) {}
            }

        for (var i = 0; i < 1; i++) {
                //state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'crafted_oil']);
                budNames += `${buds}`;
             
                state.users[from].vacoven--;

                var oil = {
                    strain: buds,
                    createdBy: from,
                    createdOn: dateCreated
                }
                if(state.users[from].xps > 999) {
                state.users[from].oil.push(oil)
                }
        }
        state.users[from].xps += 100;
        state.cs[`${json.block_num}:${from}`] = `${from} created oil with ${budNames}`
    });

    // search for qwoyn_kief from user on blockchain since genesis
    processor.on('craft_kief', function(json, from) {
        let buds = json.buds,
            budNames = '',
            dateCreated = json.block_num
        var bud = ''
        
            try{
                for (var i = 0;i < state.users[from].buds.length; i++){
                    if(state.users[from].buds[i].strain == json.buds && state.users[from].xps > 99){bud=state.users[from].buds.splice(i, 1)[0];break;}
                }
            } catch (e) {}
            if (!bud){
                try {
                    if(state.users[from].buds.length)bud == state.users[from].buds.splice(0, 1)[0]
                }catch (e) {}
            }

        for (var i = 0; i < 1; i++) {
            if(state.users[from].kiefbox > 0) {
                //state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'crafted_kief']);
                budNames += `${buds}`;
             
                state.users[from].kiefbox--;

                var kief = {
                    strain: buds,
                    createdBy: from,
                    createdOn: dateCreated
                }
                if(state.users[from].xps > 99){
                state.users[from].kief.push(kief)
                }
            }
        }

        state.cs[`${json.block_num}:${from}`] = `${from} crafted kief with ${budNames}`
    });

    // search for craft_edibles from user on blockchain since genesis
    processor.on('craft_edibles', function(json, from) {
        let buds = json.buds,
            budNames = '',
            dateCreated = json.block_num
        var bud = ''

            try{
                for (var i = 0;i < state.users[from].buds.length; i++){
                    if(state.users[from].buds[i].strain == json.buds){bud=state.users[from].buds.splice(i, 1)[0];break;}
                }
            } catch (e) {}
            if (!bud){
                try {
                    if(state.users[from].buds.length)bud == state.users[from].buds.splice(0, 1)[0]
                }catch (e) {}
            }

        for (var i = 0; i < 1; i++) {
                //state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'crafted_edibles']);
                budNames += `${buds}`;
             
                state.users[from].browniemix--;

                var edibles = {
                    strain: buds,
                    createdBy: from,
                    createdOn: dateCreated
                }

                state.users[from].edibles.push(edibles)

        }
        state.cs[`${json.block_num}:${from}`] = `${from} crafted edibles with ${budNames}`
    });

    // search for craft_joint from user on blockchain since genesis
    processor.on('craft_joint', function(json, from) {
        let buds = json.buds,
            budNames = '',
            dateCreated = json.block_num
        var bud = ''
        
            try{
                for (var i = 0;i < state.users[from].buds.length; i++){
                    if(state.users[from].buds[i].strain == json.buds && state.users[from].papers > 0 && state.users[from].xps > 99){bud=state.users[from].buds.splice(i, 1)[0];break;}
                }
            } catch (e) {}
            if (!bud){
                try {
                    if(state.users[from].buds.length)bud == state.users[from].buds.splice(0, 1)[0]
                }catch (e) {}
            }

        for (var i = 0; i < 1; i++) {
                //state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'crafted_joint']);
                budNames += `${buds}`;
             
                state.users[from].papers--;

                var joint = {
                    strain: buds,
                    createdBy: from,
                    createdOn: dateCreated
                }

                if(state.users[from].xps > 99){
                state.users[from].joints.push(joint)
                }
        }
        state.users[from].xps += 25;
        state.cs[`${json.block_num}:${from}`] = `${from} crafted joint with ${budNames}`
    });

   // search for qwoyn_joint from user on blockchain since genesis
    processor.on('craft_blunt', function(json, from) {
        let buds = json.buds,
            budNames = ''
            dateCreated = json.block_num
        var bud = ''
        
            try{
                for (var i = 0;i < state.users[from].buds.length; i++){
                    if(state.users[from].buds[i].strain == json.buds && state.users[from].bluntwraps > 0 && state.users[from].xps > 4999){bud=state.users[from].buds.splice(i, 1)[0];break;}
                }
            } catch (e) {}
            if (!bud){
                try {
                    if(state.users[from].buds.length)bud == state.users[from].buds.splice(0, 1)[0]
                }catch (e) {}
            }

        for (var i = 0; i < 1; i++) {
                //state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'crafted_blunt']);
                budNames += `${buds}`;
             
                state.users[from].bluntwraps--;

                var blunt = {
                    strain: buds,
                    createdBy: from,
                    createdOn: dateCreated
                }
                if(state.users[from].buds[i].strain == json.buds && state.users[from].xps > 4999){
                state.users[from].blunts.push(blunt)
                }

        }
        state.users[from].xps += 250;
        state.cs[`${json.block_num}:${from}`] = `${from} crafted a blunt with ${budNames}`
    });

    // search for qwoyn_pollinate from user on blockchain since genesis
    processor.on('craft_moonrocks', function(json, from) {
        let buds = json.buds,
            budNames = '',
            oil = json.oil,
            oilNames = '',
            kief = json.kief,
            kiefNames = ''
        for (var i = 0; i < 1; i++) {
                //state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'crafted_moonrocks']);
                budNames += `${buds}`;
                oilNames += `${oil}`;
                kiefNames += `${kief}`;
         
            var bud = ''

                try{
                    for (var i = 0;i < state.users[from].buds.length; i++){
                        if(state.users[from].buds[i].strain == json.buds){bud=state.users[from].buds.splice(i, 1)[0];break;}
                    }
                } catch (e) {}
                if (!bud){
                    try {
                        if(state.users[from].buds.length)bud == state.users[from].buds.splice(0, 1)[0]
                    }catch (e) {}
                }

            var kiefs = ''

                try{
                    for (var i = 0;i < state.users[from].kief.length; i++){
                        if(state.users[from].kief[i].strain == json.kief){kiefs=state.users[from].kief.splice(i, 1)[0];break;}
                    }
                } catch (e) {}
                if (!kiefs){
                    try {
                        if(state.users[from].kief.length)kiefs == state.users[from].kief.splice(0, 1)[0]
                    }catch (e) {}
                }

            var oils = ''

                try{
                    for (var i = 0;i < state.users[from].oil.length; i++){
                        if(state.users[from].oil[i].strain == json.oil){oils=state.users[from].oil.splice(i, 1)[0];break;}
                    }
                } catch (e) {}
                if (!oils){
                    try {
                        if(state.users[from].oil.length)oils == state.users[from].oil.splice(0, 1)[0]
                    }catch (e) {}
                }

                var craftedMoonrock = {
                    buds: buds,
                    oil: oil,
                    kief: kief,
                    createdBy: from,
                    createdOn: json.block_num
                }

                state.users[from].moonrocks.push(craftedMoonrock)
        }
        state.cs[`${json.block_num}:${from}`] = `${from} created a moonrock from ${budNames} bud, ${oilNames} oil and ${kiefNames} kief`
    });

    // search for qwoyn_craft_moonrocks from user on blockchain since genesis
    processor.on('craft_dipped_joint', function(json, from) {
        let buds = json.buds,
            budNames = '',
            oil = json.oil,
            oilNames = '',
            kief = json.kief,
            kiefNames = ''
        for (var i = 0; i < 1; i++) {
                //state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'crafted_dipped_joint']);
                budNames += `${buds}`;
                oilNames += `${oil}`;
                kiefNames += `${kief}`;
             
                state.users[from].papers--;

            var bud = ''
            
                try{
                    for (var i = 0;i < state.users[from].buds.length; i++){
                        if(state.users[from].buds[i].strain == json.buds && state.users[from].xps > 99999){bud=state.users[from].buds.splice(i, 1)[0];break;}
                    }
                } catch (e) {}
                if (!bud){
                    try {
                        if(state.users[from].buds.length)bud == state.users[from].buds.splice(0, 1)[0]
                    }catch (e) {}
                }

            var kiefs = ''

                try{
                    for (var i = 0;i < state.users[from].kief.length; i++){
                        if(state.users[from].kief[i].strain == json.kief && state.users[from].xps > 99999){kiefs=state.users[from].kief.splice(i, 1)[0];break;}
                    }
                } catch (e) {}
                if (!kiefs){
                    try {
                        if(state.users[from].kief.length)kiefs == state.users[from].kief.splice(0, 1)[0]
                    }catch (e) {}
                }

            var oils = ''

                try{
                    for (var i = 0;i < state.users[from].oil.length; i++){
                        if(state.users[from].oil[i].strain == json.oil && state.users[from].xps > 99999){oils=state.users[from].oil.splice(i, 1)[0];break;}
                    }
                } catch (e) {}
                if (!oils){
                    try {
                        if(state.users[from].oil.length)oils == state.users[from].oil.splice(0, 1)[0]
                    }catch (e) {}
                }
                
                var dippedJoint = {
                    buds: buds,
                    oil: oil,
                    kief: kief,
                    createdBy: from,
                    createdOn: json.block_num
                }
                if(state.users[from].buds[i].strain == json.buds && state.users[from].xps > 99999){
                state.users[from].dippedjoints.push(dippedJoint)
                }
        }
        state.cs[`${json.block_num}:${from}`] = `${from} created a dipped joint from ${budNames} bud, ${oilNames} oil and ${kiefNames} kief`
    });

     // search for qwoyn_craft_cannagar from user on blockchain since genesis
     processor.on('craft_cannagar', function(json, from) {
        let buds = json.buds,
            budNames = '',
            oil = json.oil,
            oilNames = '',
            kief = json.kief,
            kiefNames = ''

        for (var i = 0; i < 1; i++) {
                //state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'crafted_cannagar']);
                budNames += `${buds}`;
                oilNames += `${oil}`;;
                kiefNames += `${kief}`;
             
                state.users[from].hempwraps--;
                
            var bud = ''

                try{
                    for (var i = 0;i < state.users[from].buds.length; i++){
                        if(state.users[from].buds[i].strain == json.buds && state.users[from].xps > 999999){bud=state.users[from].buds.splice(i, 1)[0];break;}
                    }
                } catch (e) {}
                if (!bud){
                    try {
                        if(state.users[from].buds.length)bud == state.users[from].buds.splice(0, 1)[0]
                    }catch (e) {}
                }

            var kiefs = ''

                try{
                    for (var i = 0;i < state.users[from].kief.length; i++){
                        if(state.users[from].kief[i].strain == json.kief && state.users[from].xps > 999999){kiefs=state.users[from].kief.splice(i, 1)[0];break;}
                    }
                } catch (e) {}
                if (!kiefs){
                    try {
                        if(state.users[from].kief.length)kiefs == state.users[from].kief.splice(0, 1)[0]
                    }catch (e) {}
                }

            var oils = ''

                try{
                    for (var i = 0;i < state.users[from].oil.length; i++){
                        if(state.users[from].oil[i].strain == json.oil && state.users[from].xps > 999999){oils=state.users[from].oil.splice(i, 1)[0];break;}
                    }
                } catch (e) {}
                if (!oils){
                    try {
                        if(state.users[from].oil.length)oils == state.users[from].oil.splice(0, 1)[0]
                    }catch (e) {}
                }
                
                var cannagar = {
                    buds: buds,
                    oil: oil,
                    kief: kief,
                    createdBy: from,
                    createdOn: json.block_num
                }
                if(state.users[from].xps > 999999){
                state.users[from].cannagars.push(cannagar)
                }
        }
        state.cs[`${json.block_num}:${from}`] = `${from} created a cannagar from ${budNames} bud, ${oilNames} oil and ${kiefNames} kief`
    });

    // search for qwoyn_smoke_moonrock from user on blockchain since genesis
    processor.on('smoke_moonrock', function(json, from) {
        let moonrock = json.moonrock,
            moonrockName = '',
            friend1 = json.friend1,
            friend1Name = '',
            friend2 = json.friend2,
            friend2Name = '',
            friend3 = json.friend3,
            friend3Name = ''
        for (var i = 0; i < 1; i++) {
                //state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'smoked_moonrock']);
                moonrockName += `${moonrock}`;
                friend1Name += `${friend1}`;
                friend2Name += `${friend2}`;
                friend3Name += `${friend3}`;

                state.users[from].xps += 75;
                state.users[friend1].xps += 25;
                state.users[friend2].xps += 25;
                state.users[friend3].xps += 25;
            
                
            var moonrocks = ''

                try{
                    for (var i = 0;i < state.users[from].moonrocks.length; i++){
                        if(state.users[from].moonrocks[i].strain == json.moonrock){moonrocks=state.users[from].moonrocks.splice(i, 1)[0];break;}
                    }
                } catch (e) {}
                if (!moonrocks){
                    try {
                        if(state.users[from].moonrocks.length)moonrocks == state.users[from].moonrocks.splice(0, 1)[0]
                    }catch (e) {}
                }
        }
        state.cs[`${json.block_num}:${from}`] = `${from} smoked a ${moonrockName} moonrock with ${friend1Name}, ${friend2Name} and ${friend3Name}`
    });

    // search for qwoyn_smoke_joint from user on blockchain since genesis
    processor.on('smoke_joint', function(json, from) {
        let joint = json.joint,
            jointName = '',
            friend1 = json.friend1,
            friend1Name = '',
            friend2 = json.friend2,
            friend2Name = '',
            friend3 = json.friend3,
            friend3Name = '',
            friend4 = json.friend4,
            friend4Name = '',
            friend5 = json.friend5,
            friend5Name = ''
        for (var i = 0; i < 1; i++) {
                //state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'smoked_joint']);
                jointName += `${joint}`;
                friend1Name += `${friend1}`;
                friend2Name += `${friend2}`;
                friend3Name += `${friend3}`;
                friend4Name += `${friend4}`;
                friend5Name += `${friend5}`;

                state.users[from].xps += 25;
                state.users[friend1].xps += 5;
                state.users[friend2].xps += 5;
                state.users[friend3].xps += 5;
                state.users[friend4].xps += 5;
                state.users[friend5].xps += 5;
            
                
            var joints = ''

                try{
                    for (var i = 0;i < state.users[from].joints.length; i++){
                        if(state.users[from].joints[i].strain == json.joint){joints=state.users[from].joints.splice(i, 1)[0];break;}
                    }
                } catch (e) {}
                if (!joints){
                    try {
                        if(state.users[from].joints.length)joints == state.users[from].joints.splice(0, 1)[0]
                    }catch (e) {}
                }
        }
        state.cs[`${json.block_num}:${from}`] = `${from} smoked a ${jointName} joint with ${friend1Name}, ${friend2Name}, ${friend3Name}, ${friend4Name} and ${friend5Name}`
    });

    // search for qwoyn_smoke_blunt from user on blockchain since genesis
    processor.on('smoke_blunt', function(json, from) {
        let blunt = json.blunt,
            bluntName = '',
            friend1 = json.friend1,
            friend1Name = '',
            friend2 = json.friend2,
            friend2Name = '',
            friend3 = json.friend3,
            friend3Name = '',
            friend4 = json.friend4,
            friend4Name = '',
            friend5 = json.friend5,
            friend5Name = ''
        for (var i = 0; i < 1; i++) {
                //state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'smoked_blunt']);
                bluntName += `${blunt}`;
                friend1Name += `${friend1}`;
                friend2Name += `${friend2}`;
                friend3Name += `${friend3}`;
                friend4Name += `${friend4}`;
                friend5Name += `${friend5}`;

                state.users[from].xps += 50;
                state.users[friend1].xps += 10;
                state.users[friend2].xps += 10;
                state.users[friend3].xps += 10;
                state.users[friend4].xps += 10;
                state.users[friend5].xps += 10;
            
                
            var blunts = ''

                try{
                    for (var i = 0;i < state.users[from].blunts.length; i++){
                        if(state.users[from].blunts[i].strain == json.blunt){blunts=state.users[from].blunts.splice(i, 1)[0];break;}
                    }
                } catch (e) {}
                if (!blunts){
                    try {
                        if(state.users[from].blunts.length)blunts == state.users[from].blunts.splice(0, 1)[0]
                    }catch (e) {}
                }
        }
        state.cs[`${json.block_num}:${from}`] = `${from} smoked a ${bluntName} joint with ${friend1Name}, ${friend2Name}, ${friend3Name}, ${friend4Name} and ${friend5Name}`
    });

    // search for qwoyn_smoke_joint from user on blockchain since genesis
    processor.on('eat_edibles', function(json, from) {
        let edibles = json.edibles,
            ediblesName = '',
            friend1 = json.friend1,
            friend1Name = '',
            friend2 = json.friend2
        for (var i = 0; i < 1; i++) {
                //state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'ate edibles']);
                ediblesName += `${edibles}`;
                friend1Name += `${friend1}`;
                friend2Name += `${friend2}`;

                state.users[from].xps += 50;
                state.users[friend1].xps += 25;
                state.users[friend2].xps += 25;
                
            var edible = ''

                try{
                    for (var i = 0;i < state.users[from].blunts.length; i++){
                        if(state.users[from].edibles[i].strain == json.edibles){edible=state.users[from].edibles.splice(i, 1)[0];break;}
                    }
                } catch (e) {}
                if (!edible){
                    try {
                        if(state.users[from].edibles.length)edible == state.users[from].edibles.splice(0, 1)[0]
                    }catch (e) {}
                }
        }
        state.cs[`${json.block_num}:${from}`] = `${from} ate a ${ediblesName} brownie with ${friend1Name} and ${friend2Name}`
    });

    // search for qwoyn_smoke_blunt from user on blockchain since genesis
    processor.on('smoked_dipped_joint', function(json, from) {
        let dippedJoint = json.dippedJoint,
            dippedJointName = '',
            friend1 = json.friend1,
            friend1Name = '',
            friend2 = json.friend2,
            friend2Name = '',
            friend3 = json.friend3,
            friend3Name = '',
            friend4 = json.friend4,
            friend4Name = '',
            friend5 = json.friend5,
            friend5Name = ''
        for (var i = 0; i < 1; i++) {
                //state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'smoked_dipped_joint']);
                dippedJointName += `${dippedJoint}`;
                friend1Name += `${friend1}`;
                friend2Name += `${friend2}`;
                friend3Name += `${friend3}`;
                friend4Name += `${friend4}`;
                friend5Name += `${friend5}`;

                state.users[from].xps += 100;
                state.users[friend1].xps += 20;
                state.users[friend2].xps += 20;
                state.users[friend3].xps += 20;
                state.users[friend4].xps += 20;
                state.users[friend5].xps += 20;
            
                
            var dippedJoints = ''

                try{
                    for (var i = 0;i < state.users[from].blunts.length; i++){
                        if(state.users[from].dippedjoints[i].strain == json.dippedJoint){dippedJoints=state.users[from].dippedJoints.splice(i, 1)[0];break;}
                    }
                } catch (e) {}
                if (!dippedJoints){
                    try {
                        if(state.users[from].dippedjoints.length)dippedJoints == state.users[from].dippedjoints.splice(0, 1)[0]
                    }catch (e) {}
                }
        }
        state.cs[`${json.block_num}:${from}`] = `${from} smoked a ${dippedJointName} dipped joint with ${friend1Name}, ${friend2Name}, ${friend3Name}, ${friend4Name} and ${friend5Name}`
    });
    
        // search for qwoyn_smoke_blunt from user on blockchain since genesis
        processor.on('smoked_cannagar', function(json, from) {
            let cannagar = json.cannagar,
                cannagarName = '',
                friend1 = json.friend1,
                friend1Name = '',
                friend2 = json.friend2,
                friend2Name = '',
                friend3 = json.friend3,
                friend3Name = '',
                friend4 = json.friend4,
                friend4Name = '',
                friend5 = json.friend5,
                friend5Name = ''
            for (var i = 0; i < 1; i++) {
                   // state.users[from].stats.unshift([processor.getCurrentBlockNumber(), 'smoked_cannagar']);
                    cannagarName += `${cannagar}`;
                    friend1Name += `${friend1}`;
                    friend2Name += `${friend2}`;
                    friend3Name += `${friend3}`;
                    friend4Name += `${friend4}`;
                    friend5Name += `${friend5}`;
    
                    state.users[from].xps += 200;
                    state.users[friend1].xps += 40;
                    state.users[friend2].xps += 40;
                    state.users[friend3].xps += 40;
                    state.users[friend4].xps += 40;
                    state.users[friend5].xps += 40;
                
                    
                var cannagars = ''
    
                    try{
                        for (var i = 0;i < state.users[from].cannagars.length; i++){
                            if(state.users[from].cannagars[i].strain == json.cannagar){cannagars=state.users[from].cannagars.splice(i, 1)[0];break;}
                        }
                    } catch (e) {}
                    if (!cannagars){
                        try {
                            if(state.users[from].cannagars.length)cannagars == state.users[from].cannagars.splice(0, 1)[0]
                        }catch (e) {}
                    }
            }
            state.cs[`${json.block_num}:${from}`] = `${from} smoked a ${cannagarName} cannagar with ${friend1Name}, ${friend2Name}, ${friend3Name}, ${friend4Name} and ${friend5Name}`
        });
/*
    processor.on('return', function(json, from) {
        let lands = json.lands,
            landnames = ''
        for (var i = 0; i < lands.length; i++) {
            if (state.land[lands[i]].owner == from) {
                delete state.land[lands[i]];
                state.lands.forSale.push(lands[i]);
                state.refund.push(['xfer', from, state.stats.prices.purchase.land, `Returned ${lands[i]}`]);
                plantnames += `${plants[i]} `
            }
        }
        console.log(`${from} returned ${landnames}`)
    });
*/
    processor.on('redeem', function(j, f) {
        state.cs[`${j.block_num}:${f}`] = `Redeem Op:${f} -> ${j}`
        if (state.users[f]){if (state.users[f].v && state.users[f].v > 0) {
            state.users[f].v--
            let type = j.type || ''
            if (state.stats.supply.strains.indexOf(type) < 0) type = state.stats.supply.strains[state.users.length % state.stats.supply.strains.length]
            var seed = {
                strain: type,
                xp: 50
            }
            state.users[f].seeds.push(seed)
        }}
    });

    processor.on('adjust', function(json, from) {
        if (from == username && json.dust > 1) state.stats.dust = json.dust
        if (from == username && json.time > 1) state.stats.time = json.time
    });

    processor.on('report', function(json, from) {
        try{for (var i = 0; i < state.refund.length; i++) {
            if (state.refund[i][2].block == json.block) state.refund.splice(i, 1)
        }}catch(e){
            console.log('Reports not being made', e.message)
        }
    });

    processor.on('grant', function(json, from) {
        if(from=='hashkings'){state.users[json.to].v = 1}
    });

    // This checks for a json from hashkings and sends seeds, pollen and buds to users requested
    processor.on('patreon_tier3', function(json, from) {

        // if the user has not delegated then create user in state.users
        if (!state.users[json.delegator] && json.to == username) state.users[json.delegator] = {
        addrs: [],
        seeds: [],
        pollen: [],
        buds: [],
        breeder: '',
        farmer: 1,
        alliance: "",
        friends: [],
        inv: [],
        seeds: [],
        pollen: [],
        buds: [],
        kief: [],
        bubblehash: [],
        oil: [],
        edibles: [],
        joints: [],
        blunts: [],
        moonrocks: [],
        dippedjoints: [],
        cannagars: [],
        kiefbox: 0,
        vacoven: 0,
        bubblebags: 0,
        browniemix: 0,
        stats: [],
        traits:[],
        terps:[],
        v: 0
        }
        
        // randomize and send 5 buds to user
        function createBuds(){
            var buds = [];
            var packCount = 5;

            for (var i = 0; i < packCount; ++i) {
                buds[i] = {
                    strain: state.stats.supply.strains[Math.floor(Math.random()*state.stats.supply.strains.length)],
                    xp: 50,
                    traits: ['patreon genesis bud'],
                    terps: [],
                    pollinated: false,
                    father: 'sensimilla'
                }
            }
            if(from=='hashkings'){state.users[json.to].buds.push(buds)}
            return buds;
            }

        // randomize and send 5 pollen to user
        function createPollen(){
            var pollen = [];
            var packCount = 5;

            for (var i = 0; i < packCount; ++i) {
                pollen[i] = {
                    strain: state.stats.supply.strains[Math.floor(Math.random()*state.stats.supply.strains.length)],
                    xp: 50,
                    traits: ['patreon genesis pollen'],
                    terps: [],
                    pollinated: false,
                    father: 'sensimilla'
                }
            }
            if(from=='hashkings'){state.users[json.to].pollen.push(pollen)}
            return pollen;
            }

        // randomize and send 5 seeds to user
        function createSeeds(){
            var seeds = [];
            var packCount = 5;

            for (var i = 0; i < packCount; ++i) {
                seeds[i] = {
                    strain: state.stats.supply.strains[Math.floor(Math.random()*state.stats.supply.strains.length)],
                    xp: 50,
                    traits: ['patreon genesis seed'],
                    terps: [],
                    pollinated: false,
                    father: 'sensimilla'
                }
            }
            if(from=='hashkings'){state.users[json.to].seeds.push(seeds)}
            return seeds;
            }

            createSeeds();
            createPollen();
            createBuds();

        state.cs[`${json.block_num}:${json.to}`] = `received monthly patreon tier3 reward` 
    });
    
    //creates the weather reports
    processor.on('news', function(json, from) {
        if(from=='hashkings'){
            if(!state.news){
                state.news = {a:[],b:[],c:[],d:[],f:[],g:[],h:[],i:[],t:[]}
            }
            state.news[json.queue].push(json.body)
         }
    });

    //checks for qwoyn_give_seed and allows users to send each other seeds
    processor.on('give_seed', function(json, from) {
        var seed=''
        if(json.to && json.to.length > 2){
          try{
              for (var i = 0;i < state.users[from].seeds.length; i++){
                  if (json.qual){
                    if(state.users[from].seeds[i].strain === json.seed && state.users[from].seeds[i].xp == json.qual){
                      state.users[from].seeds[i].owner = json.to;
                      seed=state.users[from].seeds.splice(i, 1)[0]
                      break
                    }
                  } else if(state.users[from].seeds[i].strain === json.seed){
                    state.users[from].seeds[i].owner = json.to;
                    seed=state.users[from].seeds.splice(i, 1)[0]
                    break
                  }
              }
          } catch (e) {}
          if (seed) {
              if (!state.users[json.to]) {
                state.users[json.to] = {
                  addrs: [],
                  seeds: [seed],
                  buds: [],
                  pollen: [],
                  breeder: breeder,
                  farmer: farmer,
                  alliance: "",
                  friends: [],
                  inv: [],
                  seeds: [],
                  pollen: [],
                  buds: [],
                  kief: [],
                  bubblehash: [],
                  oil: [],
                  edibles: [],
                  joints: [],
                  blunts: [],
                  moonrocks: [],
                  dippedjoints: [],
                  cannagars: [],
                  kiefbox: 0,
                  vacoven: 0,
                  bubblebags: 0,
                  browniemix: 0,
                  stats: [],
                  traits:[],
                  terps:[],
                  v: 0
                }
              } else {
                  state.users[json.to].seeds.push(seed)
              }
              state.cs[`${json.block_num}:${from}`] = `${from} sent a ${seed.xp} xp ${seed.strain} to ${json.to}`
          } else {
              state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
          }
        }
    });

    //checks for json qwoyn_give_pollen and allows users to send each other pollen
    processor.on('give_pollen', function(json, from) {
        var pollen = ''
        if(json.to && json.to.length > 2){
          try{
              for (var i = 0;i < state.users[from].pollen.length; i++){
                  if (json.qual){
                    if(state.users[from].pollen[i].strain == json.pollen && state.users[from].pollen[i].xp == json.qual){
                      state.users[from].pollen[i].owner = json.to;
                      pollen = state.users[from].pollen.splice(i, 1)[0]
                      break
                    }
                  } else if(state.users[from].pollen[i].strain === json.pollen){
                    state.users[from].pollen[i].owner = json.to;
                    pollen = state.users[from].pollen.splice(i, 1)[0]
                    break
                  }
              }
          } catch (e) {}
          if (pollen) {
              if (!state.users[json.to]) {
                state.users[json.to] = {
                  addrs: [],
                  seeds: [],
                  buds: [],
                  pollen: [pollen],
                  breeder: breeder,
                  farmer: farmer,
                  alliance: "",
                  friends: [],
                  inv: [],
                  seeds: [],
                  pollen: [],
                  buds: [],
                  kief: [],
                  bubblehash: [],
                  oil: [],
                  edibles: [],
                  joints: [],
                  blunts: [],
                  moonrocks: [],
                  dippedjoints: [],
                  cannagars: [],
                  kiefbox: 0,
                  vacoven: 0,
                  bubblebags: 0,
                  browniemix: 0,
                  stats: [],
                  traits:[],
                  terps:[],
                  v: 0
                }
              } else {
                  state.users[json.to].pollen.push(pollen)
                  
              }
              state.cs[`${json.block_num}:${from}`] = `${from} sent ${pollen.strain} pollen to ${json.to}`
          } else {
              state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that pollen`
          }
        }
    });

    
   //checks for json qwoyn_give_buds and allows users to send each other buds
    processor.on('give_buds', function(json, from) {
        var bud = ''
        if(json.to && json.to.length > 2){
          try{
              for (var i = 0;i < state.users[from].buds.length; i++){
                  if(state.users[from].buds[i].strain == json.buds){
                    state.users[from].buds[i].owner = json.to;
                    bud = state.users[from].buds.splice(i, 1)[0]
                    break
                  }
              }
          } catch (e) {}
          if (bud) {
              if (!state.users[json.to]) {
                state.users[json.to] = {
                  addrs: [],
                  seeds: [],
                  pollen: [],
                  buds: [bud],
                  breeder: breeder,
                  farmer: farmer,
                  alliance: "",
                  friends: [],
                  inv: [],
                  seeds: [],
                  pollen: [],
                  buds: [],
                  kief: [],
                  bubblehash: [],
                  oil: [],
                  edibles: [],
                  joints: [],
                  blunts: [],
                  moonrocks: [],
                  dippedjoints: [],
                  cannagars: [],
                  kiefbox: 0,
                  vacoven: 0,
                  bubblebags: 0,
                  browniemix: 0,
                  stats: [],
                  traits:[],
                  terps:[],
                  v: 0
                }
              } else {
                  try {
                  state.users[json.to].buds.push(bud)
                } catch {'trying to send buds that dont belong to them'}
              }
              state.cs[`${json.block_num}:${from}`] = `${from} sent ${bud.strain} buds to ${json.to}`
          } else {
              state.cs[`${json.block_num}:${from}`] = `${from} doesn't own those buds`
          }
        }
    });
    // https://app.steemconnect.com/sign/custom-json?required_auths=%5B%5D&required_posting_auths=%5B%22jonyoudyer%22%5D&id=qwoyn_plant&json=%7B%22addr%22%3A%22a2%22%2C%22seed%22%3A0%7D
    // checks for qwoyn_plant and plants the seed
    processor.on('plant', function(json, from) {
        var index, seed=''
        try{
            index = state.users[from].addrs.indexOf(json.addr)
            for (var i = 0;i < state.users[from].seeds.length; i++){
                if(state.users[from].seeds[i].strain == json.seed){seed=state.users[from].seeds.splice(i, 1)[0];break;}
            }
        } catch (e) {}
        if (!seed){
            try {
                if(state.users[from].seeds.length)seed == state.users[from].seeds.splice(0, 1)[0]
            }catch (e) {}
        }
        if (index >= 0 && seed) {
            if (!state.land[json.addr]) {
                state.cs[`${json.block_num}:${from}`] = `planted on empty plot ${json.addr}`
                const parcel = {
                    owner: from,
                    strain: seed.strain,
                    xp: seed.xp,
                    care: [],
                    aff: [],
                    inv: [],
                    terps: [seed.terps],
                    traits: [seed.traits],
                    planted: processor.getCurrentBlockNumber(),
                    stage: 1,
                    substage: 0,
                    pollinated: seed.pollinated,
                    father: seed.father,
                }
                state.land[json.addr] = parcel
            } else if (state.land[json.addr].stage < 0) {
                state.cs[`${json.block_num}:${from}`] = `planted on harvested plot ${json.addr} `
                state.land[json.addr].strain = seed.strain
                state.land[json.addr].xp = seed.xp
                state.land[json.addr].care = []
                state.land[json.addr].aff = []
                state.land[json.addr].inv = []
                state.land[json.addr].traits = seed.traits || []
                state.land[json.addr].terps = seed.terps || []
                state.land[json.addr].planted = processor.getCurrentBlockNumber()
                state.land[json.addr].stage = 1
                state.land[json.addr].substage = 0
                state.land[json.addr].pollinated = seed.pollinated
                state.land[json.addr].father = seed.father
            } else {
                state.users[from].seeds.unshift(seed);
                state.cs[`${json.block_num}:${from}`] = `${from} can't plant ${seed} on ${index}.`
            }
        } else if (seed) {
            state.users[from].seeds.unshift(seed);
            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own ${seed}`
        } else {
            state.cs[`${json.block_num}:${from}`] = `${from} did something unexpected with a ${seed} at ${index}!`
        }
    });

    //power up steem recieved from user minus cut
    processor.onOperation('transfer_to_vesting', function(json) {
        if (json.to == username && json.from == username) {
            const amount = parseInt(parseFloat(json.amount) * 1000)
            state.cs[`${json.block_num}:${json.from}`] = `${amount} to vesting`
            state.bal.b -= amount
            state.bal.p += amount
            for (var i = 0; i < state.refund.length; i++) {
                if (state.refund[i][1] == json.to && state.refund[i][2] == amount) {
                    state.refund.splice(i, 1);
                    break;
                }
            }
        }
    });

    processor.onOperation('comment_options', function(json) {
        for(var i = 0;i<state.refund.length;i++){
            if(state.refund[i][0]=='ssign'){
                if(state.refund[i][1][0][0]=='comment'){
                    if (json.author == streamname && json.permlink == state.refund[i][1][0][1].permlink && state.refund[i][1][0][0] == 'comment') {
                        state.refund.splice(i,1)
                    }
                }
            }
        }
    });

    processor.onOperation('vote', function(json) {
        for(var i = 0;i<state.refund.length;i++){
            if(state.refund[i] && state.refund[i][0]=='sign'){
                if(state.refund[i][1][0][0]=='vote'){
                    if (json.author == streamname && json.permlink == state.refund[i][1][0][1].permlink && state.refund[i][1][0][0] == 'vote') {
                        state.refund.splice(i,1)
                    }
                }
            }
        }
    });

    //allows users to delegate for a plot
    processor.onOperation('delegate_vesting_shares', function(json, from) { 
    const vests = parseInt(parseFloat(json.vesting_shares) * 1000000)
    var record = ''
    if(json.delegatee == username){
        for (var i = 0; i < state.delegations.length; i++) {
        if (state.delegations[i].delegator == json.delegator) {
            record = state.delegations.splice(i, 1)[0]
            break;
        }
        }
        state.cs[`${json.block_num}:${json.delegator}`] = `${vests} vested` 
        if (!state.users[json.delegator] && json.delegatee == username) state.users[json.delegator] = {
        addrs: [],
        seeds: [],
        pollen: [],
        buds: [],
        breeder: '',
        farmer: 1,
        alliance: "",
        friends: [],
        inv: [],
        seeds: [],
        pollen: [],
        buds: [],
        kief: [],
        bubblehash: [],
        oil: [],
        edibles: [],
        joints: [],
        blunts: [],
        moonrocks: [],
        dippedjoints: [],
        cannagars: [],
        kiefbox: 0,
        vacoven: 0,
        bubblebags: 0,
        browniemix: 0,
        stats: [],
        traits:[],
        terps:[],
        v: 0
        }
        var availible = parseInt(vests / (state.stats.prices.listed.a * (state.stats.vs) * 1000)),
        used = 0;
        if (record) {
        const use = record.used || 0
        if (record.vests < vests) {
            availible = parseInt(availible) - parseInt(use);
            used = parseInt(use)
        } else {
            if (use > availible) {
            var j = parseInt(use) - parseInt(availible);
            for (var i = state.users[json.delegator].addrs.length - j; i < state.users[json.delegator].addrs.length; i++) {
                delete state.land[state.users[json.delegator].addrs[i]];
                state.lands.forSale.push(state.users[json.delegator].addrs[i])
                state.users[json.delegator].addrs.splice(i,1)
            }
            used = parseInt(availible)
            availible = 0
            } else {
            availible = parseInt(availible) - parseInt(use)
            used = parseInt(use)
            }
        }
        }
        state.delegations.push({
            delegator: json.delegator,
            vests,
            availible,
            used
        })
    }
    });

    processor.onOperation('transfer', function(json, from) {
        var wrongTransaction = 'qwoyn'
        if (json.to == username && json.amount.split(' ')[1] == 'STEEM') {
            const amount = parseInt(parseFloat(json.amount) * 1000)
            fetch(`http://blacklist.usesteem.com/user/${json.from}`)
            .then(function(response) {
                return response.json();
            })
            .then(function(myJson) {
                if(myJson.blacklisted.length == 0){
                    if (!state.users[json.from]) state.users[json.from] = {
                addrs: [], 
                seeds: [],
                xps: 0,
                pollen: [],
                buds: [],
                alliance: "",
                friends: [],
                inv: [],
                seeds: [],
                pollen: [],
                buds: [],
                kief: [],
                bubblehash: [],
                oil: [],
                edibles: [],
                joints: [],
                blunts: [],
                moonrocks: [],
                dippedjoints: [],
                cannagars: [],
                kiefbox: 0,
                vacoven: 0,
                bubblebags: 0,
                browniemix: 0,
                stats: [],
                traits:[],
                terps:[],
                blacklist: true,
                v: 0,
                a: 0,
                u: 0
            }
            var want = json.memo.split(" ")[0].toLowerCase() || json.memo.toLowerCase(),
                type = json.memo.split(" ")[1] || '',
                seller = json.memo.split(" ")[2] || ''
            if (
                state.stats.prices.listed[want] == amount ||
                // leasing fee 
                amount == 500 && type == 'manage' && state.stats.prices.listed[want] ||
                // seeds 
                want == 'rseed' && amount == state.stats.prices.listed.seeds.reg || 
                want == 'mseed' && amount == state.stats.prices.listed.seeds.mid || 
                want == 'tseed' && amount == state.stats.prices.listed.seeds.top || 
                want == 'spseed' && amount == state.stats.prices.listed.seeds.special ||
                //tools 
                want == 'papers' && amount == state.stats.prices.listed.seeds.special || 
                want == 'kiefbox' && amount == state.stats.prices.listed.seeds.special || 
                want == 'vacoven' && amount == state.stats.prices.listed.seeds.special || 
                want == 'bluntwrap' && amount == state.stats.prices.listed.seeds.special ||
                want == 'browniemix' && amount == state.stats.prices.listed.seeds.special ||
                want == 'hempwraps' && amount == state.stats.prices.listed.seeds.special
                ) {
                if (state.stats.supply.land[want]) {
                    var allowed = false
                    if (amount == 500 && type == 'manage') {
                        state.cs[`${json.block_num}:${json.from}`] = `${json.from} is managing`
                        for (var i = 0; i < state.delegations.length; i++) {
                            if (json.from == state.delegations[i].delegator && state.delegations[i].availible) {
                                state.delegations[i].availible--;
                                state.delegations[i].used++;
                                state.bal.c += amount;
                                allowed = true
                                break;
                            }
                        }
                    } else {
                        const c = parseInt(amount * 0.75)
                        state.bal.c += c
                        state.bal.b += amount - c
                        allowed = true
                    }
                    if (allowed) {
                        state.stats.supply.land[want]--
                        const sel = `${want}c`
                        const num = state.stats.supply.land[sel]++
                        var addr = `${want}${num}`
                        state.users[json.from].addrs.push(addr)
                        state.cs[`${json.block_num}:${json.from}`] = `${json.from} purchased land at plot #${addr}`
                    } else {
                        state.refund.push(['xfer', json.from, amount, 
                        '<h3>Automated Hashkings Response</h3>\nThanks for trying to lease a plot on Hashkings but it looks like you have used up your plot credits and may need to delegate more STEEM POWER. Please return to the [Hashkings Market](https://www.hashkings.app/markets) to delegate more SP\nIf you feel this is an error please contact our DEV TEAM in our [Discord Server](https://discord.gg/xabv5az)\n<h5>Thank you so much for you support!</h5>\n<a href="https://www.hashkings.app"><img src="https://i.imgur.com/MQYSNVK.png"></a>'])
                    }
                    // purchasing seeds
                } else if (want == 'rseed' && amount == state.stats.prices.listed.seeds.reg || 
                           want == 'mseed' && amount == state.stats.prices.listed.seeds.mid || 
                           want == 'tseed' && amount == state.stats.prices.listed.seeds.top || 
                           want == 'spseed' && amount == state.stats.prices.listed.seeds.special
                           ) {
                    if (state.stats.supply.strains.indexOf(type) < 0){ type = state.stats.supply.strains[state.users.length % (state.stats.supply.strains.length -1)]}
                    var seed = {
                        strain: type,
                        owner: json.from,
                        traits: ['genesis seeds'],
                        terps: [],
                        thc: 'coming soon',
                        cbd: 'coming soon',
                        breeder: 'Landrace Strain',
                        familyTree: 'Landrace Strain',
                        pollinated: false
                    }
                    if (!state.users[json.to]) {
                        state.users[json.to] = {
                          addrs: [],
                          seeds: [seed],
                          buds: [],
                          pollen: [],
                          breeder: breeder,
                          farmer: farmer,
                          alliance: "",
                          friends: [],
                          inv: [],
                          seeds: [],
                          pollen: [],
                          buds: [],
                          kief: [],
                          bubblehash: [],
                          oil: [],
                          edibles: [],
                          joints: [],
                          blunts: [],
                          moonrocks: [],
                          dippedjoints: [],
                          cannagars: [],
                          kiefbox: 0,
                          vacoven: 0,
                          bubblebags: 0,
                          browniemix: 0,
                          stats: [],
                          traits:[],
                          terps:[],
                          v: 0
                        }
                      }
                    state.users[json.from].xps += 1;
                    state.users[json.from].seeds.push(seed)

                    const c = parseInt(amount * 0.75)
                    state.bal.c += c
                    state.bal.b += amount - c
                    state.cs[`${json.block_num}:${json.from}`] = `${json.from} purchased ${seed.strain}`
                    // purchasing posted seeds
                }  else if (want == 'rseed' && amount == state.stats.prices.listed.seeds.reg || 
                            want == 'mseed' && amount == state.stats.prices.listed.seeds.mid || 
                            want == 'tseed' && amount == state.stats.prices.listed.seeds.top || 
                            want == 'spseed' && amount == state.stats.prices.listed.seeds.special
                            ) {
                    if (state.stats.supply.strains.indexOf(type) < 0){ type = state.stats.supply.strains[state.users.length % (state.stats.supply.strains.length -1)]}
                    var seed = {
                        strain: type,
                        owner: json.from,
                        traits: ['genesis seeds'],
                        terps: [],
                        thc: 'coming soon',
                        cbd: 'coming soon',
                        breeder: 'Landrace Strain',
                        familyTree: 'Landrace Strain',
                        pollinated: false
                    }
                    if (!state.users[json.to]) {
                        state.users[json.to] = {
                          addrs: [],
                          seeds: [seed],
                          buds: [],
                          pollen: [],
                          breeder: breeder,
                          farmer: farmer,
                          alliance: "",
                          friends: [],
                          inv: [],
                          seeds: [],
                          pollen: [],
                          buds: [],
                          kief: [],
                          bubblehash: [],
                          oil: [],
                          edibles: [],
                          joints: [],
                          blunts: [],
                          moonrocks: [],
                          dippedjoints: [],
                          cannagars: [],
                          kiefbox: 0,
                          vacoven: 0,
                          bubblebags: 0,
                          browniemix: 0,
                          stats: [],
                          traits:[],
                          terps:[],
                          v: 0
                        }
                      }
                    state.users[json.from].xps += 1;
                    state.users[json.from].seeds.push(seed)

                    const c = parseInt(amount * 0.75)
                    state.bal.c += c
                    state.bal.b += amount - c
                    state.cs[`${json.block_num}:${json.from}`] = `${json.from} purchased ${seed.strain}`
                } else if (want == 'papers' && amount == state.stats.prices.listed.supplies.papers && state.users[from].xps > 100 || 
                           want == 'keifbox' && amount == state.stats.prices.listed.supplies.keifbox && state.users[from].xps > 100 || 
                           want == 'vacoven' && amount == state.stats.prices.listed.supplies.vacoven && state.users[from].xps > 1000 || 
                           want == 'bluntwraps' && amount == state.stats.prices.listed.supplies.bluntwraps && state.users[from].xps > 5000 || 
                           want == 'browniemix' && amount == state.stats.prices.listed.supplies.browniemix && state.users[from].xps > 10000 || 
                           want == 'hempwraps' && amount == state.stats.prices.listed.supplies.hempwraps && state.users[from].xps > 25000
                           ) {
                    if (want == 'papers') {
                        state.users[json.from].papers+=10;
                        state.users[json.from].xps += 10;
                    }
                    if (want == 'kiefbox') {
                        state.users[json.from].kiefbox+=10; 
                        state.users[json.from].xps += 10; 
                    }
                    if (want == 'vacoven') {
                        state.users[json.from].vacoven+=10; 
                        state.users[json.from].xps += 10; 
                    }
                    if (want == 'bluntwraps') {
                        state.users[json.from].bluntwraps+=5; 
                        state.users[json.from].xps += 50; 
                    }
                    if (want == 'browniemix') {
                        state.users[json.from].browniemix+=5; 
                        state.users[json.from].xps += 100; 
                    }
                    if (want == 'hempwraps') { 
                        state.users[json.from].hempwraps++; 
                        state.users[json.from].xps += 250; 
                    }
                    const c = parseInt(amount * 0.75)
                    state.bal.c += c
                    state.bal.b += amount - c
                    state.cs[`${json.block_num}:${json.from}`] = `${json.from} purchased ${want}`
                    } else if (
                           want == 'post_seed_hk'  && state.users[seller].seeds[type].forSale === 1 || 
                           want == 'post_seed_dp'  && state.users[seller].seeds[type].forSale === 1 || 
                           want == 'post_seed_lb'  && state.users[seller].seeds[type].forSale === 1 || 
                           want == 'post_seed_afg' && state.users[seller].seeds[type].forSale === 1 || 
                           want == 'post_seed_lkg' && state.users[seller].seeds[type].forSale === 1 || 
                           want == 'post_seed_mis' && state.users[seller].seeds[type].forSale === 1 ||
                           want == 'post_seed_kbr' && state.users[seller].seeds[type].forSale === 1 || 
                           want == 'post_seed_aca' && state.users[seller].seeds[type].forSale === 1 || 
                           want == 'post_seed_swz' && state.users[seller].seeds[type].forSale === 1 || 
                           want == 'post_seed_kmj' && state.users[seller].seeds[type].forSale === 1 || 
                           want == 'post_seed_mal' && state.users[seller].seeds[type].forSale === 1 ||
                           want == 'post_seed_pam' && state.users[seller].seeds[type].forSale === 1 || 
                           want == 'post_seed_cg'  && state.users[seller].seeds[type].forSale === 1 || 
                           want == 'post_seed_ach' && state.users[seller].seeds[type].forSale === 1 || 
                           want == 'post_seed_tha' && state.users[seller].seeds[type].forSale === 1 || 
                           want == 'post_seed_cht' && state.users[seller].seeds[type].forSale === 1 ||
                           want == 'post_seed_sog' && state.users[seller].seeds[type].forSale === 1
                           ) {
                    if (want == 'post_seed_hk') {
                        try{
                            for (var i = 0;i < state.users[from].seeds.length; i++){
                                if (json.want){
                                  if(state.users[from].seeds[i].strain === type){
                                    state.users[from].seeds[i].owner = seller;
                                    state.users[seller].seeds[type].forSale--;
                                    type=state.users[from].seeds.splice(i, 1)[0]
                                    break
                                  }
                                } else if(state.users[from].seeds[i].strain === type){
                                  state.users[from].seeds[i].owner = seller;
                                  state.users[seller].seeds[type].forSale--;
                                  type=state.users[from].seeds.splice(i, 1)[0]
                                  break
                                }
                            }
                        } catch (e) {}
                        if (type) {
                            if (!state.users[seller]) {
                              state.users[seller] = {
                                addrs: [],
                                seeds: [type],
                                buds: [],
                                pollen: [],
                                breeder: breeder,
                                farmer: farmer,
                                alliance: "",
                                friends: [],
                                inv: [],
                                seeds: [],
                                pollen: [],
                                buds: [],
                                kief: [],
                                bubblehash: [],
                                oil: [],
                                edibles: [],
                                joints: [],
                                blunts: [],
                                moonrocks: [],
                                dippedjoints: [],
                                cannagars: [],
                                kiefbox: 0,
                                vacoven: 0,
                                bubblebags: 0,
                                browniemix: 0,
                                stats: [],
                                traits:[],
                                terps:[],
                                v: 0
                              }
                            } else {
                                state.users[seller].seeds.push(type)
                            }
                            state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                        } else {
                            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                        }
                    }
                    if (want == 'post_seed_dp') {
                        try{
                            for (var i = 0;i < state.users[from].seeds.length; i++){
                                if (json.want){
                                  if(state.users[from].seeds[i].strain === type){
                                    state.users[from].seeds[i].owner = seller;
                                    state.users[seller].seeds[type].forSale--;
                                    type=state.users[from].seeds.splice(i, 1)[0]
                                    break
                                  }
                                } else if(state.users[from].seeds[i].strain === type){
                                  state.users[from].seeds[i].owner = seller;
                                  state.users[seller].seeds[type].forSale--;
                                  type=state.users[from].seeds.splice(i, 1)[0]
                                  break
                                }
                            }
                        } catch (e) {}
                        if (type) {
                            if (!state.users[seller]) {
                              state.users[seller] = {
                                addrs: [],
                                seeds: [type],
                                buds: [],
                                pollen: [],
                                breeder: breeder,
                                farmer: farmer,
                                alliance: "",
                                friends: [],
                                inv: [],
                                seeds: [],
                                pollen: [],
                                buds: [],
                                kief: [],
                                bubblehash: [],
                                oil: [],
                                edibles: [],
                                joints: [],
                                blunts: [],
                                moonrocks: [],
                                dippedjoints: [],
                                cannagars: [],
                                kiefbox: 0,
                                vacoven: 0,
                                bubblebags: 0,
                                browniemix: 0,
                                stats: [],
                                traits:[],
                                terps:[],
                                v: 0
                              }
                            } else {
                                state.users[seller].seeds.push(type)
                            }
                            state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                        } else {
                            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                        }
                    }
                    if (want == 'post_seed_lb') {
                        try{
                            for (var i = 0;i < state.users[from].seeds.length; i++){
                                if (json.want){
                                  if(state.users[from].seeds[i].strain === type){
                                    state.users[from].seeds[i].owner = seller;
                                    state.users[seller].seeds[type].forSale--;
                                    type=state.users[from].seeds.splice(i, 1)[0]
                                    break
                                  }
                                } else if(state.users[from].seeds[i].strain === type){
                                  state.users[from].seeds[i].owner = seller;
                                  state.users[seller].seeds[type].forSale--;
                                  type=state.users[from].seeds.splice(i, 1)[0]
                                  break
                                }
                            }
                        } catch (e) {}
                        if (type) {
                            if (!state.users[seller]) {
                              state.users[seller] = {
                                addrs: [],
                                seeds: [type],
                                buds: [],
                                pollen: [],
                                breeder: breeder,
                                farmer: farmer,
                                alliance: "",
                                friends: [],
                                inv: [],
                                seeds: [],
                                pollen: [],
                                buds: [],
                                kief: [],
                                bubblehash: [],
                                oil: [],
                                edibles: [],
                                joints: [],
                                blunts: [],
                                moonrocks: [],
                                dippedjoints: [],
                                cannagars: [],
                                kiefbox: 0,
                                vacoven: 0,
                                bubblebags: 0,
                                browniemix: 0,
                                stats: [],
                                traits:[],
                                terps:[],
                                v: 0
                              }
                            } else {
                                state.users[seller].seeds.push(type)
                            }
                            state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                        } else {
                            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                        }
                    }
                    if (want == 'post_seed_afg') {
                        try{
                            for (var i = 0;i < state.users[from].seeds.length; i++){
                                if (json.want){
                                  if(state.users[from].seeds[i].strain === type){
                                    state.users[from].seeds[i].owner = seller;
                                    state.users[seller].seeds[type].forSale--;
                                    type=state.users[from].seeds.splice(i, 1)[0]
                                    break
                                  }
                                } else if(state.users[from].seeds[i].strain === type){
                                  state.users[from].seeds[i].owner = seller;
                                  state.users[seller].seeds[type].forSale--;
                                  type=state.users[from].seeds.splice(i, 1)[0]
                                  break
                                }
                            }
                        } catch (e) {}
                        if (type) {
                            if (!state.users[seller]) {
                              state.users[seller] = {
                                addrs: [],
                                seeds: [type],
                                buds: [],
                                pollen: [],
                                breeder: breeder,
                                farmer: farmer,
                                alliance: "",
                                friends: [],
                                inv: [],
                                seeds: [],
                                pollen: [],
                                buds: [],
                                kief: [],
                                bubblehash: [],
                                oil: [],
                                edibles: [],
                                joints: [],
                                blunts: [],
                                moonrocks: [],
                                dippedjoints: [],
                                cannagars: [],
                                kiefbox: 0,
                                vacoven: 0,
                                bubblebags: 0,
                                browniemix: 0,
                                stats: [],
                                traits:[],
                                terps:[],
                                v: 0
                              }
                            } else {
                                state.users[seller].seeds.push(type)
                            }
                            state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                        } else {
                            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                        }
                    }
                    if (want == 'post_seed_lkg') {
                        try{
                            for (var i = 0;i < state.users[from].seeds.length; i++){
                                if (json.want){
                                  if(state.users[from].seeds[i].strain === type){
                                    state.users[from].seeds[i].owner = seller;
                                    state.users[seller].seeds[type].forSale--;
                                    type=state.users[from].seeds.splice(i, 1)[0]
                                    break
                                  }
                                } else if(state.users[from].seeds[i].strain === type){
                                  state.users[from].seeds[i].owner = seller;
                                  state.users[seller].seeds[type].forSale--;
                                  type=state.users[from].seeds.splice(i, 1)[0]
                                  break
                                }
                            }
                        } catch (e) {}
                        if (type) {
                            if (!state.users[seller]) {
                              state.users[seller] = {
                                addrs: [],
                                seeds: [type],
                                buds: [],
                                pollen: [],
                                breeder: breeder,
                                farmer: farmer,
                                alliance: "",
                                friends: [],
                                inv: [],
                                seeds: [],
                                pollen: [],
                                buds: [],
                                kief: [],
                                bubblehash: [],
                                oil: [],
                                edibles: [],
                                joints: [],
                                blunts: [],
                                moonrocks: [],
                                dippedjoints: [],
                                cannagars: [],
                                kiefbox: 0,
                                vacoven: 0,
                                bubblebags: 0,
                                browniemix: 0,
                                stats: [],
                                traits:[],
                                terps:[],
                                v: 0
                              }
                            } else {
                                state.users[seller].seeds.push(type)
                            }
                            state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                        } else {
                            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                        }
                    }
                    if (want == 'post_seed_mis') {
                        try{
                            for (var i = 0;i < state.users[from].seeds.length; i++){
                                if (json.want){
                                  if(state.users[from].seeds[i].strain === type){
                                    state.users[from].seeds[i].owner = seller;
                                    state.users[seller].seeds[type].forSale--;
                                    type=state.users[from].seeds.splice(i, 1)[0]
                                    break
                                  }
                                } else if(state.users[from].seeds[i].strain === type){
                                  state.users[from].seeds[i].owner = seller;
                                  state.users[seller].seeds[type].forSale--;
                                  type=state.users[from].seeds.splice(i, 1)[0]
                                  break
                                }
                            }
                        } catch (e) {}
                        if (type) {
                            if (!state.users[seller]) {
                              state.users[seller] = {
                                addrs: [],
                                seeds: [type],
                                buds: [],
                                pollen: [],
                                breeder: breeder,
                                farmer: farmer,
                                alliance: "",
                                friends: [],
                                inv: [],
                                seeds: [],
                                pollen: [],
                                buds: [],
                                kief: [],
                                bubblehash: [],
                                oil: [],
                                edibles: [],
                                joints: [],
                                blunts: [],
                                moonrocks: [],
                                dippedjoints: [],
                                cannagars: [],
                                kiefbox: 0,
                                vacoven: 0,
                                bubblebags: 0,
                                browniemix: 0,
                                stats: [],
                                traits:[],
                                terps:[],
                                v: 0
                              }
                            } else {
                                state.users[seller].seeds.push(type)
                            }
                            state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                        } else {
                            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                        }
                    }
                    if (want == 'post_seed_kbr') {
                        try{
                            for (var i = 0;i < state.users[from].seeds.length; i++){
                                if (json.want){
                                  if(state.users[from].seeds[i].strain === type){
                                    state.users[from].seeds[i].owner = seller;
                                    state.users[seller].seeds[type].forSale--;
                                    type=state.users[from].seeds.splice(i, 1)[0]
                                    break
                                  }
                                } else if(state.users[from].seeds[i].strain === type){
                                  state.users[from].seeds[i].owner = seller;
                                  state.users[seller].seeds[type].forSale--;
                                  type=state.users[from].seeds.splice(i, 1)[0]
                                  break
                                }
                            }
                        } catch (e) {}
                        if (type) {
                            if (!state.users[seller]) {
                              state.users[seller] = {
                                addrs: [],
                                seeds: [type],
                                buds: [],
                                pollen: [],
                                breeder: breeder,
                                farmer: farmer,
                                alliance: "",
                                friends: [],
                                inv: [],
                                seeds: [],
                                pollen: [],
                                buds: [],
                                kief: [],
                                bubblehash: [],
                                oil: [],
                                edibles: [],
                                joints: [],
                                blunts: [],
                                moonrocks: [],
                                dippedjoints: [],
                                cannagars: [],
                                kiefbox: 0,
                                vacoven: 0,
                                bubblebags: 0,
                                browniemix: 0,
                                stats: [],
                                traits:[],
                                terps:[],
                                v: 0
                              }
                            } else {
                                state.users[seller].seeds.push(type)
                            }
                            state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                        } else {
                            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                        }
                    }
                    if (want == 'post_seed_aca') {
                        try{
                            for (var i = 0;i < state.users[from].seeds.length; i++){
                                if (json.want){
                                  if(state.users[from].seeds[i].strain === type){
                                    state.users[from].seeds[i].owner = seller;
                                    state.users[seller].seeds[type].forSale--;
                                    type=state.users[from].seeds.splice(i, 1)[0]
                                    break
                                  }
                                } else if(state.users[from].seeds[i].strain === type){
                                  state.users[from].seeds[i].owner = seller;
                                  state.users[seller].seeds[type].forSale--;
                                  type=state.users[from].seeds.splice(i, 1)[0]
                                  break
                                }
                            }
                        } catch (e) {}
                        if (type) {
                            if (!state.users[seller]) {
                              state.users[seller] = {
                                addrs: [],
                                seeds: [type],
                                buds: [],
                                pollen: [],
                                breeder: breeder,
                                farmer: farmer,
                                alliance: "",
                                friends: [],
                                inv: [],
                                seeds: [],
                                pollen: [],
                                buds: [],
                                kief: [],
                                bubblehash: [],
                                oil: [],
                                edibles: [],
                                joints: [],
                                blunts: [],
                                moonrocks: [],
                                dippedjoints: [],
                                cannagars: [],
                                kiefbox: 0,
                                vacoven: 0,
                                bubblebags: 0,
                                browniemix: 0,
                                stats: [],
                                traits:[],
                                terps:[],
                                v: 0
                              }
                            } else {
                                state.users[seller].seeds.push(type)
                            }
                            state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                        } else {
                            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                        }
                    }
                    if (want == 'post_seed_swz') {
                        try{
                            for (var i = 0;i < state.users[from].seeds.length; i++){
                                if (json.want){
                                  if(state.users[from].seeds[i].strain === type){
                                    state.users[from].seeds[i].owner = seller;
                                    state.users[seller].seeds[type].forSale--;
                                    type=state.users[from].seeds.splice(i, 1)[0]
                                    break
                                  }
                                } else if(state.users[from].seeds[i].strain === type){
                                  state.users[from].seeds[i].owner = seller;
                                  state.users[seller].seeds[type].forSale--;
                                  type=state.users[from].seeds.splice(i, 1)[0]
                                  break
                                }
                            }
                        } catch (e) {}
                        if (type) {
                            if (!state.users[seller]) {
                              state.users[seller] = {
                                addrs: [],
                                seeds: [type],
                                buds: [],
                                pollen: [],
                                breeder: breeder,
                                farmer: farmer,
                                alliance: "",
                                friends: [],
                                inv: [],
                                seeds: [],
                                pollen: [],
                                buds: [],
                                kief: [],
                                bubblehash: [],
                                oil: [],
                                edibles: [],
                                joints: [],
                                blunts: [],
                                moonrocks: [],
                                dippedjoints: [],
                                cannagars: [],
                                kiefbox: 0,
                                vacoven: 0,
                                bubblebags: 0,
                                browniemix: 0,
                                stats: [],
                                traits:[],
                                terps:[],
                                v: 0
                              }
                            } else {
                                state.users[seller].seeds.push(type)
                            }
                            state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                        } else {
                            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                        }
                    }
                    if (want == 'post_seed_kmj') {
                        try{
                            for (var i = 0;i < state.users[from].seeds.length; i++){
                                if (json.want){
                                  if(state.users[from].seeds[i].strain === type){
                                    state.users[from].seeds[i].owner = seller;
                                    state.users[seller].seeds[type].forSale--;
                                    type=state.users[from].seeds.splice(i, 1)[0]
                                    break
                                  }
                                } else if(state.users[from].seeds[i].strain === type){
                                  state.users[from].seeds[i].owner = seller;
                                  state.users[seller].seeds[type].forSale--;
                                  type=state.users[from].seeds.splice(i, 1)[0]
                                  break
                                }
                            }
                        } catch (e) {}
                        if (type) {
                            if (!state.users[seller]) {
                              state.users[seller] = {
                                addrs: [],
                                seeds: [type],
                                buds: [],
                                pollen: [],
                                breeder: breeder,
                                farmer: farmer,
                                alliance: "",
                                friends: [],
                                inv: [],
                                seeds: [],
                                pollen: [],
                                buds: [],
                                kief: [],
                                bubblehash: [],
                                oil: [],
                                edibles: [],
                                joints: [],
                                blunts: [],
                                moonrocks: [],
                                dippedjoints: [],
                                cannagars: [],
                                kiefbox: 0,
                                vacoven: 0,
                                bubblebags: 0,
                                browniemix: 0,
                                stats: [],
                                traits:[],
                                terps:[],
                                v: 0
                              }
                            } else {
                                state.users[seller].seeds.push(type)
                            }
                            state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                        } else {
                            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                        }
                    }
                    if (want == 'post_seed_dp') {
                        try{
                            for (var i = 0;i < state.users[from].seeds.length; i++){
                                if (json.want){
                                  if(state.users[from].seeds[i].strain === type){
                                    state.users[from].seeds[i].owner = seller;
                                    state.users[seller].seeds[type].forSale--;
                                    type=state.users[from].seeds.splice(i, 1)[0]
                                    break
                                  }
                                } else if(state.users[from].seeds[i].strain === type){
                                  state.users[from].seeds[i].owner = seller;
                                  state.users[seller].seeds[type].forSale--;
                                  type=state.users[from].seeds.splice(i, 1)[0]
                                  break
                                }
                            }
                        } catch (e) {}
                        if (type) {
                            if (!state.users[seller]) {
                              state.users[seller] = {
                                addrs: [],
                                seeds: [type],
                                buds: [],
                                pollen: [],
                                breeder: breeder,
                                farmer: farmer,
                                alliance: "",
                                friends: [],
                                inv: [],
                                seeds: [],
                                pollen: [],
                                buds: [],
                                kief: [],
                                bubblehash: [],
                                oil: [],
                                edibles: [],
                                joints: [],
                                blunts: [],
                                moonrocks: [],
                                dippedjoints: [],
                                cannagars: [],
                                kiefbox: 0,
                                vacoven: 0,
                                bubblebags: 0,
                                browniemix: 0,
                                stats: [],
                                traits:[],
                                terps:[],
                                v: 0
                              }
                            } else {
                                state.users[seller].seeds.push(type)
                            }
                            state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                        } else {
                            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                        }
                    }
                    if (want == 'post_seed_mal') {
                        try{
                            for (var i = 0;i < state.users[from].seeds.length; i++){
                                if (json.want){
                                  if(state.users[from].seeds[i].strain === type){
                                    state.users[from].seeds[i].owner = seller;
                                    state.users[seller].seeds[type].forSale--;
                                    type=state.users[from].seeds.splice(i, 1)[0]
                                    break
                                  }
                                } else if(state.users[from].seeds[i].strain === type){
                                  state.users[from].seeds[i].owner = seller;
                                  state.users[seller].seeds[type].forSale--;
                                  type=state.users[from].seeds.splice(i, 1)[0]
                                  break
                                }
                            }
                        } catch (e) {}
                        if (type) {
                            if (!state.users[seller]) {
                              state.users[seller] = {
                                addrs: [],
                                seeds: [type],
                                buds: [],
                                pollen: [],
                                breeder: breeder,
                                farmer: farmer,
                                alliance: "",
                                friends: [],
                                inv: [],
                                seeds: [],
                                pollen: [],
                                buds: [],
                                kief: [],
                                bubblehash: [],
                                oil: [],
                                edibles: [],
                                joints: [],
                                blunts: [],
                                moonrocks: [],
                                dippedjoints: [],
                                cannagars: [],
                                kiefbox: 0,
                                vacoven: 0,
                                bubblebags: 0,
                                browniemix: 0,
                                stats: [],
                                traits:[],
                                terps:[],
                                v: 0
                              }
                            } else {
                                state.users[seller].seeds.push(type)
                            }
                            state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                        } else {
                            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                        }
                    }
                    if (want == 'post_seed_pam') {
                        try{
                            for (var i = 0;i < state.users[from].seeds.length; i++){
                                if (json.want){
                                  if(state.users[from].seeds[i].strain === type){
                                    state.users[from].seeds[i].owner = seller;
                                    state.users[seller].seeds[type].forSale--;
                                    type=state.users[from].seeds.splice(i, 1)[0]
                                    break
                                  }
                                } else if(state.users[from].seeds[i].strain === type){
                                  state.users[from].seeds[i].owner = seller;
                                  state.users[seller].seeds[type].forSale--;
                                  type=state.users[from].seeds.splice(i, 1)[0]
                                  break
                                }
                            }
                        } catch (e) {}
                        if (type) {
                            if (!state.users[seller]) {
                              state.users[seller] = {
                                addrs: [],
                                seeds: [type],
                                buds: [],
                                pollen: [],
                                breeder: breeder,
                                farmer: farmer,
                                alliance: "",
                                friends: [],
                                inv: [],
                                seeds: [],
                                pollen: [],
                                buds: [],
                                kief: [],
                                bubblehash: [],
                                oil: [],
                                edibles: [],
                                joints: [],
                                blunts: [],
                                moonrocks: [],
                                dippedjoints: [],
                                cannagars: [],
                                kiefbox: 0,
                                vacoven: 0,
                                bubblebags: 0,
                                browniemix: 0,
                                stats: [],
                                traits:[],
                                terps:[],
                                v: 0
                              }
                            } else {
                                state.users[seller].seeds.push(type)
                            }
                            state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                        } else {
                            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                        }
                    }
                    if (want == 'post_seed_cg') {
                        try{
                            for (var i = 0;i < state.users[from].seeds.length; i++){
                                if (json.want){
                                  if(state.users[from].seeds[i].strain === type){
                                    state.users[from].seeds[i].owner = seller;
                                    state.users[seller].seeds[type].forSale--;
                                    type=state.users[from].seeds.splice(i, 1)[0]
                                    break
                                  }
                                } else if(state.users[from].seeds[i].strain === type){
                                  state.users[from].seeds[i].owner = seller;
                                  state.users[seller].seeds[type].forSale--;
                                  type=state.users[from].seeds.splice(i, 1)[0]
                                  break
                                }
                            }
                        } catch (e) {}
                        if (type) {
                            if (!state.users[seller]) {
                              state.users[seller] = {
                                addrs: [],
                                seeds: [type],
                                buds: [],
                                pollen: [],
                                breeder: breeder,
                                farmer: farmer,
                                alliance: "",
                                friends: [],
                                inv: [],
                                seeds: [],
                                pollen: [],
                                buds: [],
                                kief: [],
                                bubblehash: [],
                                oil: [],
                                edibles: [],
                                joints: [],
                                blunts: [],
                                moonrocks: [],
                                dippedjoints: [],
                                cannagars: [],
                                kiefbox: 0,
                                vacoven: 0,
                                bubblebags: 0,
                                browniemix: 0,
                                stats: [],
                                traits:[],
                                terps:[],
                                v: 0
                              }
                            } else {
                                state.users[seller].seeds.push(type)
                            }
                            state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                        } else {
                            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                        }
                    }
                    if (want == 'post_seed_ach') {
                        try{
                            for (var i = 0;i < state.users[from].seeds.length; i++){
                                if (json.want){
                                  if(state.users[from].seeds[i].strain === type){
                                    state.users[from].seeds[i].owner = seller;
                                    state.users[seller].seeds[type].forSale--;
                                    type=state.users[from].seeds.splice(i, 1)[0]
                                    break
                                  }
                                } else if(state.users[from].seeds[i].strain === type){
                                  state.users[from].seeds[i].owner = seller;
                                  state.users[seller].seeds[type].forSale--;
                                  type=state.users[from].seeds.splice(i, 1)[0]
                                  break
                                }
                            }
                        } catch (e) {}
                        if (type) {
                            if (!state.users[seller]) {
                              state.users[seller] = {
                                addrs: [],
                                seeds: [type],
                                buds: [],
                                pollen: [],
                                breeder: breeder,
                                farmer: farmer,
                                alliance: "",
                                friends: [],
                                inv: [],
                                seeds: [],
                                pollen: [],
                                buds: [],
                                kief: [],
                                bubblehash: [],
                                oil: [],
                                edibles: [],
                                joints: [],
                                blunts: [],
                                moonrocks: [],
                                dippedjoints: [],
                                cannagars: [],
                                kiefbox: 0,
                                vacoven: 0,
                                bubblebags: 0,
                                browniemix: 0,
                                stats: [],
                                traits:[],
                                terps:[],
                                v: 0
                              }
                            } else {
                                state.users[seller].seeds.push(type)
                            }
                            state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                        } else {
                            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                        }
                    }
                    if (want == 'post_seed_tha') {
                        try{
                            for (var i = 0;i < state.users[from].seeds.length; i++){
                                if (json.want){
                                  if(state.users[from].seeds[i].strain === type){
                                    state.users[from].seeds[i].owner = seller;
                                    state.users[seller].seeds[type].forSale--;
                                    type=state.users[from].seeds.splice(i, 1)[0]
                                    break
                                  }
                                } else if(state.users[from].seeds[i].strain === type){
                                  state.users[from].seeds[i].owner = seller;
                                  state.users[seller].seeds[type].forSale--;
                                  type=state.users[from].seeds.splice(i, 1)[0]
                                  break
                                }
                            }
                        } catch (e) {}
                        if (type) {
                            if (!state.users[seller]) {
                              state.users[seller] = {
                                addrs: [],
                                seeds: [type],
                                buds: [],
                                pollen: [],
                                breeder: breeder,
                                farmer: farmer,
                                alliance: "",
                                friends: [],
                                inv: [],
                                seeds: [],
                                pollen: [],
                                buds: [],
                                kief: [],
                                bubblehash: [],
                                oil: [],
                                edibles: [],
                                joints: [],
                                blunts: [],
                                moonrocks: [],
                                dippedjoints: [],
                                cannagars: [],
                                kiefbox: 0,
                                vacoven: 0,
                                bubblebags: 0,
                                browniemix: 0,
                                stats: [],
                                traits:[],
                                terps:[],
                                v: 0
                              }
                            } else {
                                state.users[seller].seeds.push(type)
                            }
                            state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                        } else {
                            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                        }
                    }
                    if (want == 'post_seed_cht') {
                        try{
                            for (var i = 0;i < state.users[from].seeds.length; i++){
                                if (json.want){
                                  if(state.users[from].seeds[i].strain === type){
                                    state.users[from].seeds[i].owner = seller;
                                    state.users[seller].seeds[type].forSale--;
                                    type=state.users[from].seeds.splice(i, 1)[0]
                                    break
                                  }
                                } else if(state.users[from].seeds[i].strain === type){
                                  state.users[from].seeds[i].owner = seller;
                                  state.users[seller].seeds[type].forSale--;
                                  type=state.users[from].seeds.splice(i, 1)[0]
                                  break
                                }
                            }
                        } catch (e) {}
                        if (type) {
                            if (!state.users[seller]) {
                              state.users[seller] = {
                                addrs: [],
                                seeds: [type],
                                buds: [],
                                pollen: [],
                                breeder: breeder,
                                farmer: farmer,
                                alliance: "",
                                friends: [],
                                inv: [],
                                seeds: [],
                                pollen: [],
                                buds: [],
                                kief: [],
                                bubblehash: [],
                                oil: [],
                                edibles: [],
                                joints: [],
                                blunts: [],
                                moonrocks: [],
                                dippedjoints: [],
                                cannagars: [],
                                kiefbox: 0,
                                vacoven: 0,
                                bubblebags: 0,
                                browniemix: 0,
                                stats: [],
                                traits:[],
                                terps:[],
                                v: 0
                              }
                            } else {
                                state.users[seller].seeds.push(type)
                            }
                            state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                        } else {
                            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                        }
                    }
                    if (want == 'post_seed_sog') {
                        try{
                            for (var i = 0;i < state.users[from].seeds.length; i++){
                                if (json.want){
                                  if(state.users[from].seeds[i].strain === type){
                                    state.users[from].seeds[i].owner = seller;
                                    state.users[seller].seeds[type].forSale--;
                                    type=state.users[from].seeds.splice(i, 1)[0]
                                    break
                                  }
                                } else if(state.users[from].seeds[i].strain === type){
                                  state.users[from].seeds[i].owner = seller;
                                  state.users[seller].seeds[type].forSale--;
                                  type=state.users[from].seeds.splice(i, 1)[0]
                                  break
                                }
                            }
                        } catch (e) {}
                        if (type) {
                            if (!state.users[seller]) {
                              state.users[seller] = {
                                addrs: [],
                                seeds: [type],
                                buds: [],
                                pollen: [],
                                breeder: breeder,
                                farmer: farmer,
                                alliance: "",
                                friends: [],
                                inv: [],
                                seeds: [],
                                pollen: [],
                                buds: [],
                                kief: [],
                                bubblehash: [],
                                oil: [],
                                edibles: [],
                                joints: [],
                                blunts: [],
                                moonrocks: [],
                                dippedjoints: [],
                                cannagars: [],
                                kiefbox: 0,
                                vacoven: 0,
                                bubblebags: 0,
                                browniemix: 0,
                                stats: [],
                                traits:[],
                                terps:[],
                                v: 0
                              }
                            } else {
                                state.users[seller].seeds.push(type)
                            }
                            state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                        } else {
                            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                        }
                    }
                    //pay hashkings
                    const c = parseInt(amount * 0.01)
                    state.bal.c += c
                    state.bal.b += amount - c
                    state.cs[`${json.block_num}:${json.from}`] = `${json.from} purchased ${want} from ${seller}`
                    //pay seller
                    state.refund.push(['xfer', seller, amount * 0.99, 'You succesfully completed a purchase from' + seller + "|" + want])
                    state.cs[`${json.block_num}:${json.from}`] = `${json.from} succesfully completed a purchase with ${seller} | ${want}`
                    //bud sales
                 } else if (
                        want == 'post_bud_hk'  && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_bud_dp'  && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_bud_lb'  && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_bud_afg' && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_bud_lkg' && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_bud_mis' && state.users[seller].seeds[type].forSale === 1 ||
                        want == 'post_bud_kbr' && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_bud_aca' && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_bud_swz' && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_bud_kmj' && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_bud_mal' && state.users[seller].seeds[type].forSale === 1 ||
                        want == 'post_bud_pam' && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_bud_cg'  && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_bud_ach' && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_bud_tha' && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_bud_cht' && state.users[seller].seeds[type].forSale === 1 ||
                        want == 'post_bud_sog' && state.users[seller].seeds[type].forSale === 1
                        ) {
                 if (want == 'post_bud_hk') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_bud_dp') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_bud_lb') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_bud_afg') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_bud_lkg') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_bud_mis') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_bud_kbr') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_bud_aca') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_bud_swz') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_bud_kmj') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_bud_dp') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_bud_mal') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_bud_pam') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_bud_cg') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_bud_ach') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_bud_tha') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_bud_cht') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_bud_sog') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 //pay hashkings
                 const c = parseInt(amount * 0.01)
                 state.bal.c += c
                 state.bal.b += amount - c
                 state.cs[`${json.block_num}:${json.from}`] = `${json.from} purchased ${want} from ${seller}`
                 //pay seller
                 state.refund.push(['xfer', seller, amount * 0.99, 'You succesfully completed a purchase from' + seller + "|" + want])
                 state.cs[`${json.block_num}:${json.from}`] = `${json.from} succesfully completed a purchase with ${seller} | ${want}`
                    //pollen sales
                    } else if (
                        want == 'post_pollen_hk'  && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_pollen_dp'  && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_pollen_lb'  && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_pollen_afg' && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_pollen_lkg' && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_pollen_mis' && state.users[seller].seeds[type].forSale === 1 ||
                        want == 'post_pollen_kbr' && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_pollen_aca' && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_pollen_swz' && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_pollen_kmj' && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_pollen_mal' && state.users[seller].seeds[type].forSale === 1 ||
                        want == 'post_pollen_pam' && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_pollen_cg'  && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_pollen_ach' && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_pollen_tha' && state.users[seller].seeds[type].forSale === 1 || 
                        want == 'post_pollen_cht' && state.users[seller].seeds[type].forSale === 1 ||
                        want == 'post_pollen_sog' && state.users[seller].seeds[type].forSale === 1
                        ) {
                 if (want == 'post_pollen_hk') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_pollen_dp') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_pollen_lb') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_pollen_afg') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_pollen_lkg') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_pollen_mis') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_pollen_kbr') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_pollen_aca') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_pollen_swz') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_pollen_kmj') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_pollen_dp') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_pollen_mal') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_pollen_pam') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_pollen_cg') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_pollen_ach') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_pollen_tha') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_pollen_cht') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 if (want == 'post_pollen_sog') {
                     try{
                         for (var i = 0;i < state.users[from].seeds.length; i++){
                             if (json.want){
                               if(state.users[from].seeds[i].strain === type){
                                 state.users[from].seeds[i].owner = seller;
                                 state.users[seller].seeds[type].forSale--;
                                 type=state.users[from].seeds.splice(i, 1)[0]
                                 break
                               }
                             } else if(state.users[from].seeds[i].strain === type){
                               state.users[from].seeds[i].owner = seller;
                               state.users[seller].seeds[type].forSale--;
                               type=state.users[from].seeds.splice(i, 1)[0]
                               break
                             }
                         }
                     } catch (e) {}
                     if (type) {
                         if (!state.users[seller]) {
                           state.users[seller] = {
                             addrs: [],
                             seeds: [type],
                             buds: [],
                             pollen: [],
                             breeder: breeder,
                             farmer: farmer,
                             alliance: "",
                             friends: [],
                             inv: [],
                             seeds: [],
                             pollen: [],
                             buds: [],
                             kief: [],
                             bubblehash: [],
                             oil: [],
                             edibles: [],
                             joints: [],
                             blunts: [],
                             moonrocks: [],
                             dippedjoints: [],
                             cannagars: [],
                             kiefbox: 0,
                             vacoven: 0,
                             bubblebags: 0,
                             browniemix: 0,
                             stats: [],
                             traits:[],
                             terps:[],
                             v: 0
                           }
                         } else {
                             state.users[seller].seeds.push(type)
                         }
                         state.cs[`${json.block_num}:${from}`] = `${from} bought a ${type.strain} from ${seller}`
                     } else {
                         state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that seed`
                     }
                 }
                 //pay hashkings
                 const c = parseInt(amount * 0.01)
                 state.bal.c += c
                 state.bal.b += amount - c
                 state.cs[`${json.block_num}:${json.from}`] = `${json.from} purchased ${want} from ${seller}`
                 //pay seller
                 state.refund.push(['xfer', seller, amount * 0.99, 'You succesfully completed a purchase from' + seller + "|" + want])
                 state.cs[`${json.block_num}:${json.from}`] = `${json.from} succesfully completed a purchase with ${seller} | ${want}`
                 }
                    else {
                        state.refund.push(['xfer', wrongTransaction, amount, json.from + ' sent a weird transfer...refund?'])
                        state.cs[`${json.block_num}:${json.from}`] = `${json.from} sent a weird transfer trying to buy tools...please check wallet`
                    }
            } else if (amount > 10000000) {
                state.bal.r += amount
                state.refund.push(['xfer', wrongTransaction, amount, json.from + ' sent a weird transfer...refund?'])
                state.cs[`${json.block_num}:${json.from}`] = `${json.from} sent a weird transfer trying to purchase seeds/tools or managing land...please check wallet`
            }
                } else {
                    if (state.blacklist[json.from]){
                        var users = parseInt(amount/2),
                            ops = parseInt(amount - users)
                        state.balance.b += users
                        state.bal.c += ops
                    } else {
                        state.bal.r += amount
                        state.refund.push(['xfer', json.from, amount, 'This account is on the global blacklist. You may remove your delegation, any further transfers will be treated as donations.\n\nIf you feel this may be an error please contact our DEV TEAM in our [Discord Server](https://discord.gg/xabv5az)'])
                        state.blacklist[json.from] = true
                        state.cs[`${json.block_num}:${json.from}`] = `${json.from} blacklisted`
                    }
                }
            })

        } else if (json.from == username) {
            const amount = parseInt(parseFloat(json.amount) * 1000)
            for (var i = 0; i < state.refund.length; i++) {
                if (state.refund[i][1] == json.to && state.refund[i][2] == amount) {
                    state.refund.splice(i, 1);
                    state.bal.r -= amount;
                    state.cs[`${json.block_num}:${json.to}`] = `${json.to} refunded successfully`
                    break;
                }
            }
        }
    });
    processor.onStreamingStart(function() {
        console.log("At real time.")
    });

    processor.start();

    //var transactor = steemTransact(client, steem, prefix);
    processor.on('return', function(json, from) {
        var index = state.users[from].addrs.indexOf(json.addr)
        if (index >= 0) {
            state.lands.forSale.push(state.users[from].addrs.splice(i, 1))
            state.bal.r += state.stats.prices.purchase.land
            if (state.bal.b - state.stats.prices.purchase.land > 0) {
                state.bal.b -= state.stats.prices.purchase.land
            } else {
                state.bal.d += state.stats.prices.purchase.land
            }
            state.refund.push(['xfer', from, state.stats.prices.purchase.land, 'We\'re sorry to see you go!'])
        }

    });

    function exit() {
        console.log('Exiting...');
        processor.stop(function() {
            saveState(function() {
                process.exit();
                //console.log('Process exited.');
            });
        });
    }
}

function ipfsSaveState(blocknum, hashable) {
    ipfs.add(Buffer.from(JSON.stringify([blocknum, hashable]), 'ascii'), (err, IpFsHash) => {
        if (!err) {
            if (IpFsHash[0].hash === undefined){
               ipfsSaveState(blocknum, hashable) 
            } else {
                state.stats.bu = IpFsHash[0].hash
                state.stats.bi = blocknum
                console.log(blocknum + `:Saved:  ${IpFsHash[0].hash}`)
                state.refund.push(['customJson', 'report', {
                    stateHash: state.stats.bu,
                    block: blocknum
                }])
            }
        } else {
            console.log('IPFS Error', err)
        }
    })
};
var bot = {
    xfer: function(toa, amount, memo) {
        const float = parseFloat(amount / 1000).toFixed(3)
        const data = {
            amount: `${float} STEEM`,
            from: username,
            to: toa,
            memo: memo
        }
        console.log(data, key)
        client.broadcast.transfer(data, key).then(
            function(result) {
                console.log(result)
            },
            function(error) {
                console.log(error)
            }
        );
    },
    customJson: function(id, json, callback) {
        if(json.block > processor.getCurrentBlockNumber() - 1000){
        client.broadcast.json({
            required_auths: [],
            required_posting_auths: [username],
            id: prefix + id,
            json: JSON.stringify(json),
        }, key).then(
            result => {
                console.log('Signed ${json}')
            },
            error => {
                console.log('Error sending customJson')
            }
        )} else {state.refund.splice(0,1)}
    },
    sign: function(op, callback) {
        console.log('attempting'+op[0])
        client.broadcast.sendOperations(op, key).then(
            function(result) {
                console.log(result)
            },
            function(error) {
                console.log(error)
                state.refund.pop()
            }
        );
    },
    ssign: function(op, callback) {
        console.log('attempting'+op[0])
        client.broadcast.sendOperations(op, skey).then(
            function(result) {
                console.log(result)
            },
            function(error) {
                console.log(error)
                state.refund.pop()
            }
        );
    },
    power: function(toa, amount, callback) {
        const op = [
            'transfer_to_vesting',
            {
                from: username,
                to: toa,
                amount: `${parseFloat(amount/1000).toFixed(3)} STEEM`,
            },
        ];
        client.broadcast.sendOperations([op], key).then(
            function(result) {
                console.log(result)
            },
            function(error) {
                console.log(error)
            }
        );
    },
    sendOp: function(op) {
        client.broadcast.sendOperations(op, key).then(
            function(result) {
                console.log(result)
            },
            function(error) {
                console.log(error)
            }
        );
    }
}

function whotopay() {
    var a = {
            a: [],
            b: [],
            c: [],
            d: [],
            e: [],
            f: [],
            g: [],
            h: [],
            i: [],
            j: []
        }, // 10 arrays for bennies
        b = 0, // counter
        c = 0, // counter
        h = 1, // top value
        r = {j:0,i:0,h:0,g:0,f:0,e:0,d:0,c:0,b:0,a:0}
        o = [] // temp array
    for (d in state.kudos) {
        c = parseInt(c) + parseInt(state.kudos[d]) // total kudos
        if (state.kudos[d] > h) { // top kudos(for sorting)
            h = state.kudos[d]
        };
        if (state.kudos[d] == 1) { // for sorting , unshift 1 assuming most will be 1
            o.unshift({
                account: d,
                weight: 1
            })
        } else {
            if(!o.length){o.unshift({ //if nothing to sort, unshift into array
                account: d,
                weight: parseInt(state.kudos[d])
            })}
            for (var i = o.length - 1; i > 0; i--) { // insert sort
                    if (state.kudos[d] <= o[i].weight) {
                        o.splice(i, 0, {
                            account: d,
                            weight: parseInt(state.kudos[d])
                        });
                        break;
                    } else if (state.kudos[d] > o[o.length-1].weight) {
                        o.push({
                            account: d,
                            weight: parseInt(state.kudos[d])
                        });
                        break;
                    }
            }
        }
    }
    if (o.length > (maxEx * 10)) {
        b = (maxEx * 10)
    } else {
        b = o.length
    }
    while (b) { // assign bennies to posts, top kudos down
        for (var fo in a) {
            a[fo].push(o.pop());
            b--
            if(!b)break;
        }
        if(b){
            for (var fr in r) {
                a[fr].push(o.pop());
                b--
                if(!b)break;
            }
        }
    }
    state.kudos = {} //put back bennies over the max extentions limit
        for (var i = 0; i < o.length; i++) {
            state.kudos[o[i].account] = parseInt(o[i].weight)
        }
    for (var r in a) { //weight the 8 accounts in 10000
        var u = 0,
            q = 0
        for (var i = 0; i < a[r].length; i++) {
            u = parseInt(u) + parseInt(a[r][i].weight)
        }
        q = parseInt(10000/u)
        for (var i = 0; i < a[r].length; i++) {
            a[r][i].weight = parseInt(parseInt(a[r][i].weight) * q)
        }
    }
    o = []
    for (var i in a){
        o.push(a[i])
    }
    console.log('payday:'+o)
    return o
}
function sortExtentions(a, key) {
    var b=[],c=[]
    for(i=0;i<a.length;i++){
        b.push(a[i][key])
    }
    b = b.sort()
    while (c.length < a.length){
      for(i=0;i<a.length;i++){
        if(a[i][key] == b[0]){
            c.push(a[i])
            b.shift()
        }
      }
    }
    return c
}

function popWeather (loc){
    return new Promise((resolve, reject) => {
        fetch(`http://api.openweathermap.org/data/2.5/forecast?lat=${state.stats.env[loc].lat}&lon=${state.stats.env[loc].lon}&APPID=${wkey}`)
        .then(function(response) {
            return response.json();
        })
        .then(function(r) {
            var tmin=400,tmax=0,tave=0,precip=0,h=0,p=[],c=[],w={s:0,d:0},s=[],d=r.list[0].wind.deg
            for(i=0;i<8;i++){
                tave += parseInt(parseFloat(r.list[i].main.temp)*100)
                if(r.list[i].main.temp > tmax){tmax = r.list[i].main.temp}
                if(r.list[i].main.temp < tmin){tmin = r.list[i].main.temp}
                h = r.list[i].main.humidity
                c = parseInt(c + parseInt(r.list[i].clouds.all))
                if(r.list[i].rain){
                    precip = parseFloat(precip) + parseFloat(r.list[i].rain['3h'])
                }
                s = r.list[i].wind.speed
            }
            tave = parseFloat(tave/800).toFixed(1)
            c = parseInt(c/8)
            state.stats.env[loc].weather = {
                high: tmax,
                low: tmin,
                avg: tave,
                precip,
                clouds: c,
                humidity: h,
                winds: s,
                windd: d
            }
            resolve(loc)
        }).catch(e=>{
            reject(e)
        })
    })
}

/*function autoPoster (loc, num) {
    var body = `\nhttps://source.unsplash.com/user/kimzy/1600x900# \n${state.stats.env[loc].name} Growers Daily News\n`, bens = ''
    var footer = `\n<center><h1>Hashkings Official Links</h1>
    \n[Hashkings Web App](https://www.hashkings.app)
    \n[Hashkings Discord](https://discord.gg/QW6tWF9)
    \n[Hashkings Github Repository](https://github.com/dpdanpittman/Hashkings-2D-UI)
    \n</center>
    \n
    \n<center>![divider.png](https://smoke.io/imageupload_data/ee12bc223b16e8b3b16671dc95795f597b986400)</center>
    \n<center><h1>STEEM Community Showcase</h1></center>
    \nWe love community and the [Canna-Curate Server](https://discord.gg/DcsPHUG) has the most knowledgeable growers and smokers on the Blockchain.  Stop by and stay a while, spark up a bowl and chat with some of the members.
    \n<a href="https://discord.gg/DcsPHUG"><img src="https://steemitimages.com/640x0/https://cdn.steemitimages.com/DQmV9PhMNu2JaR9BEJFhSdxjd4SA7nWj7yG131z9sRRYHJc/JPEG_20180729_131244.jpg">
    \n***canna-curate | The #1 Cannabis Curation Trail on STEEM***
    \n***Read what our farmers have to say [here](https://steempeak.com/hashkings/@chronocrypto/invest-in-the-game-and-get-beneficiary-rewards-hashkings) and please don't hesitate to reach out in the comments below!***`
    if (state.news[loc].length > 0){
        body = body + state.news[loc][0];state.news[loc].shift();
    }
    body = body + `\n## Todays Weather\nYou can expect ${cloudy(state.stats.env[loc].weather.clouds)} with a high of ${parseFloat(state.stats.env[loc].weather.high - 272.15).toFixed(1)} Celsius. Winds will be out of the ${metWind(state.stats.env[loc].weather.windd)} at ${parseFloat(state.stats.env[loc].weather.winds).toFixed(1)} M/s. `
    if (state.stats.env[loc].weather.precip){body = body + `Models predict ${parseFloat(state.stats.env[loc].weather.precip).toFixed(2)}mm of rain. `}
    body = body + `Relative humidity will be around ${state.stats.env[loc].weather.humidity}% and a low of ${parseFloat(state.stats.env[loc].weather.low - 272.15).toFixed(1)} Celsius overnight.\n` + footer
    body = body + listBens(state.payday[0])
    var ops = [["comment",
                         {"parent_author": "",
                          "parent_permlink": 'hashkings',
                          "author": streamname,
                          "permlink": 'h'+num,
                          "title": `Hashkings Almanac for ${state.stats.env[loc].name} | ${num}`,
                          "body": body,
                          "json_metadata": JSON.stringify({tags:["hk-stream"]})}]]
    if(state.payday.length){
        state.payday[0] = sortExtentions(state.payday[0],'account')
        bens = ["comment_options",
                         {"author": streamname,
                          "permlink": 'h'+num,
                          "max_accepted_payout": "1000000.000 SBD",
                          "percent_steem_dollars": 10000,
                          "allow_votes": true,
                          "allow_curation_rewards": true,
                          "extensions":
                          [[0,
                            {"beneficiaries":state.payday[0]}]]}]
        ops.push(bens)
        state.payday.shift()
    }
    state.refund.push(['ssign',ops])
}*/

function cloudy(per){
    const range = parseInt(per/20)
    switch(range){
        case 4:
            return 'cloudy skies'
            break;
        case 3:
            return 'mostly cloudy skies'
            break;
        case 2:
            return 'scattered clouds in the sky'
            break;
        case 1:
            return 'mostly clear skies'
            break;
        default:
            return 'clear skies'

    }
}
function metWind(deg){
    const range = parseInt((deg-22.5)/8)
    switch(range){
        case 7:
            return 'North'
            break;
        case 6:
            return 'Northwest'
            break;
        case 5:
            return 'West'
            break;
        case 4:
            return 'Southwest'
            break;
        case 3:
            return 'South'
            break;
        case 2:
            return 'Southeast'
            break;
        case 1:
            return 'East'
            break;
        default:
            return 'Northeast'

    }
}

function listBens (bens){
    var text = `\n<h4>All Hashkings Rewards go directly to our users!</h4>
                \n
                \nThis post benefits:
                \n`
    for(i=0;i<bens.length;i++){
        text = text + `* @${bens[i].account} with ${parseFloat(bens[i].weight/100).toFixed(2)}%\n`
    }
    return text
}

function sexing (){
    var sexAtBirth = 'Not Sexed';

    sex = Math.floor(Math.random() * 10) % 1.90;

    if(sex >= 1){
        sexAtBirth = "male";
    } else{
        sexAtBirth = "female";
    }
    return sexAtBirth
}

function daily(addr) {
    var grown = false
    if (state.land[addr]) {
        for (var i = 0; i < state.land[addr].care.length; i++) {
            if (state.land[addr].care[i][0] <= processor.getCurrentBlockNumber() - 28800) {
                state.land[addr].care.splice(i,1)
            } else if (state.land[addr].care[i][0] > processor.getCurrentBlockNumber() - 28800 && state.land[addr].care[i][1] == 'watered') {
                if(!grown)state.land[addr].care[i].push('')
                if (state.land[addr].substage < 7 && state.land[addr].stage > 0 && !grown) {
                    if(!grown){
                        state.land[addr].substage++;
                        grown = true;
                        kudo(state.land[addr].owner)
                    } else {
                        state.land[addr].aff.push([processor.getCurrentBlockNumber(), 'You watered too soon']);
                    }
                }
                if (state.land[addr].substage == 7) {
                    state.land[addr].substage = 0;
                    state.land[addr].stage++
                }
                //added sexing
                if (state.land[addr].stage == 2 && state.land[addr].substage == 0) state.land[addr].sex = sexing()//state.land.length % 1
                
                //afflictions
                if (state.land[addr].stage == 100 && state.land[addr].substage == 0) {
                    state.land[addr].aff.push([processor.getCurrentBlockNumber(), 'over']);
                    state.land[addr].substage = 7
                }
                for (var j = 0; j < state.land[addr].aff.length; j++) {
                    try {
                    if (state.land[addr].aff[j][0] > processor.getCurrentBlockNumber() - 86400 && state.land[addr].aff[j][1] == 'over') {
                        state.land[addr].substage--;
                        break;
                    }
                } catch(e) {
                    console.log('An affliction happened', e.message)
                   }
                }
            }
        }
    }
}