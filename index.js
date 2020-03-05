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

//overal game stats i.e. number of gardeners, number of plots available, seed prices, land price, weather info
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
var startingBlock = ENV.STARTINGBLOCK || 41376060; //GENESIS BLOCK
const username = ENV.ACCOUNT || 'hashkings'; //account with all the SP
const key = steem.PrivateKey.from(ENV.KEY); //active key for account
const sh = ENV.sh || '';
const ago = ENV.ago || 41376060;
const prefix = ENV.PREFIX || 'qwoyn_'; // part of custom json visible on the blockchain during watering etc..
const clientURL = ENV.APIURL || 'https://api.steemit.com' // can be changed to another node
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

//assigns kudos to user. kudos determine who has properly watered their plants and 
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
               popWeather(o).then((r)=>{console.log(r);autoPoster(r,num)}).catch((e)=>{console.log(e)})
            }
            if (sun - state.stats.offsets[o] == 1500) {
               state.refund.push(['sign',[["vote",{"author":streamname,"permlink":`h${num-300}`,"voter":username,"weight":10000}]]])
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
        var body = `\nhttps://i.imgur.com/jTxih7O.png
        \n
        \n<center><h1>What is Kief?</h1></center>
        \n
        \n>Ever wonder what to call all those tiny, sticky crystals that cover cannabis flower? They’re called kief, also known as dry sift or pollen.
        \n>
        \n>Kief refers to the resin glands which contain the terpenes and cannabinoids that make cannabis so unique. While marijuana sans kief still contains cannabinoids, the resin glands that develop on flower buds pack the biggest punch.*
        \n>
        \n><h8>_Source: [Leafly](https://www.leafly.com)_</h8>
        \n
        \n***The Kief(KFQ) in-game currency is just that, a sticky terpene filled resin gland loaded with cannabanoids aka, The Life Blood of HashKings.***
        \n
        \n
        \n<center><h1>Kief Specs</h1></center>
        \n
        \n**Total Supply: 4,200,000 KFQ**
        \n**Decimals: 8**
        \n
        \n<u>Distribution</u>|<u>Capabilities</u>|
        \n-|-|
        \nAirdrop: 444,719 KFQ| Staking|
        \nDev Fund: 15%| Mining|
        \n60/40 Split: 1,680,000 KFQ (Locked)|	|
        \nAvailable: 1,697,281 KFQ| |
        \n
        \n
        \n<center><h1>What is Kief Token(KFQ) used for?</h1></center>
        \n
        \n<h4><u>In-Game Currency</u></h4>
        \nKief is an in-game currency used to buy nutrients, greenhouses, soil and various farm equipment.
        \n
        \n<h4><u>Staking</u></h4>
        \nKief can also be used to help the HashKings Economy by becoming an active participant in the survival of the Game.  Stake your tokens to earn many of the benefits listed in the next section.
        \n
        \n
        \n<center><h1>What are the benefits of Kief Token?</h1></center>
        \n<h4>Farmers Association Board</h4>
        \n
        \nBecome a board member and vote on important decisions in the HashKings ecosystem. The minimum stake for applying to become part of the board is 21,000 KFQ.
        \n
        \nDuties of the Board Members include but are not limited to
        \n- Voting on Strains
        \n- Voting on Regions
        \n- Voting on HashKings Features
        \n- Voting on Item Prices
        \n
        \n<h4>Staking Rewards</h4>
        \n
        \nStaking is the easiest way to earn KFQ has a 4 week cooldown period and rewards are halved every 100,000 Kief Tokens.
        \n
        \n_The table below describes the weekly payout._
        \n
        \nStaked Amount| Payout
        \n-|-
        \n500 KFQ| 10 KFQ
        \n1000 KFQ| 25 KFQ
        \n2500 KFQ| 50 KFQ
        \n5000 KFQ| 100 KFQ
        \n10000 KFQ| 200 KFQ
        \n21000 KFQ | 500 KFQ
        \n
        \n<h4>Discounts</h4>
        \n
        \nStaking the tokens earns you discounts in the HashKings Dispensary.
        \n
        \n<u>Staked Amount</u>|<u>Discount</u>|
        \n-|-|
        \n1000  KFQ| 1%|
        \n2500  KFQ| 5%|
        \n5000  KFQ| 10%|
        \n10000 KFQ| 15%|
        \n21000 KFQ| 25%
        \n
        \n
        \n<center><h1>Why Kief Tokens?</h1></center>
        \n
        \n- This in-game currency has a very low supply of 4.2 million which makes it extremely rare and the value of in-game items are determined by the market.
        \n 
        \n- Staking KFQ is the only way to become a board member with a minimum entry of 21,000. 
        \n
        \n- HashKings is a top 100 dApp out of 2500+ according to [Stateofthedapps.com](https://www.stateofthedapps.com).  
        \n
        \n- **Limited supply** once they are gone the only way to purchase them is on an exchange. 
        \n
        \n- We are partnered with the #1 Cannabis Curation Trail and Community on STEEM, Canna-Curate.\n`
        var footer = `\n<center><h1>Hashkings Official Links</h1></center>
        \n
        \n<center>[Hashkings Web App](https://www.hashkings.app)    
        \n[Hashkings Discord](https://discord.gg/QW6tWF9)      
        \n[Hashkings Github Repository](https://github.com/dpdanpittman/Hashkings-2D-UI)</center>
        \n
        \n        
        \n<center>![divider.png](https://smoke.io/imageupload_data/ee12bc223b16e8b3b16671dc95795f597b986400)</center>
        \n        
        \n<center><h1>STEEM Community Showcase</h1></center>
        \n
        \n       
        \nWe love community and the [Canna-Curate Server](https://discord.gg/DcsPHUG) has the most knowledgeable growers and smokers on the Blockchain.  Stop by and stay a while, spark up a bowl and chat with some of the members.
        \n
        \n<center>
        <a href="https://discord.gg/DcsPHUG"><img src="https://steemitimages.com/640x0/https://cdn.steemitimages.com/DQmV9PhMNu2JaR9BEJFhSdxjd4SA7nWj7yG131z9sRRYHJc/JPEG_20180729_131244.jpg"></center>
        \n
        \n***canna-curate | The #1 Cannabis Curation Trail on STEEM***
        \n
        \n       
        \n### Read what our farmers have to say [here](https://steempeak.com/hashkings/@chronocrypto/invest-in-the-game-and-get-beneficiary-rewards-hashkings) and please don't hesitate to reach out in the comments below!
        \n`
            if (state.news.h.length > 0){
                body = body + state.news.h[0] + footer ;state.news.h.shift();
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
    }
        if (num % 28800 === 20300 && state.payday && state.payday[0].length) {
            state.refund.push(['sign',[["vote",{"author":streamname,"permlink":`h${num-300}`,"voter":username,"weight":10000}]]])
        }
        if (num % 28800 === 25000 && state.payday.length) {

            state.payday[0] = sortExtentions(state.payday[0],'account')
            var body = `\nhttps://i.imgur.com/jTxih7O.png
            \n
            \n<center><h1>What is Kief?</h1></center>
            \n
            \n>Ever wonder what to call all those tiny, sticky crystals that cover cannabis flower? They’re called kief, also known as dry sift or pollen.
            \n>
            \n>Kief refers to the resin glands which contain the terpenes and cannabinoids that make cannabis so unique. While marijuana sans kief still contains cannabinoids, the resin glands that develop on flower buds pack the biggest punch.*
            \n>
            \n><h8>_Source: [Leafly](https://www.leafly.com)_</h8>
            \n
            \n***The Kief(KFQ) in-game currency is just that, a sticky terpene filled resin gland loaded with cannabanoids aka, The Life Blood of HashKings.***
            \n
            \n
            \n<center><h1>Kief Specs</h1></center>
            \n
            \n**Total Supply: 4,200,000 KFQ**
            \n**Decimals: 8**
            \n
            \n<u>Distribution</u>|<u>Capabilities</u>|
            \n-|-|
            \nAirdrop: 444,719 KFQ| Staking|
            \nDev Fund: 15%| Mining|
            \n60/40 Split: 1,680,000 KFQ (Locked)|	|
            \nAvailable: 1,697,281 KFQ| |
            \n
            \n
            \n<center><h1>What is Kief Token(KFQ) used for?</h1></center>
            \n
            \n<h4><u>In-Game Currency</u></h4>
            \nKief is an in-game currency used to buy nutrients, greenhouses, soil and various farm equipment.
            \n
            \n<h4><u>Staking</u></h4>
            \nKief can also be used to help the HashKings Economy by becoming an active participant in the survival of the Game.  Stake your tokens to earn many of the benefits listed in the next section.
            \n
            \n
            \n<center><h1>What are the benefits of Kief Token?</h1></center>
            \n<h4>Farmers Association Board</h4>
            \n
            \nBecome a board member and vote on important decisions in the HashKings ecosystem. The minimum stake for applying to become part of the board is 21,000 KFQ.
            \n
            \nDuties of the Board Members include but are not limited to
            \n- Voting on Strains
            \n- Voting on Regions
            \n- Voting on HashKings Features
            \n- Voting on Item Prices
            \n
            \n<h4>Staking Rewards</h4>
            \n
            \nStaking is the easiest way to earn KFQ has a 4 week cooldown period and rewards are halved every 100,000 Kief Tokens.
            \n
            \n_The table below describes the weekly payout._
            \n
            \nStaked Amount| Payout
            \n-|-
            \n500 KFQ| 10 KFQ
            \n1000 KFQ| 25 KFQ
            \n2500 KFQ| 50 KFQ
            \n5000 KFQ| 100 KFQ
            \n10000 KFQ| 200 KFQ
            \n21000 KFQ | 500 KFQ
            \n
            \n<h4>Discounts</h4>
            \n
            \nStaking the tokens earns you discounts in the HashKings Dispensary.
            \n
            \n<u>Staked Amount</u>|<u>Discount</u>|
            \n-|-|
            \n1000  KFQ| 1%|
            \n2500  KFQ| 5%|
            \n5000  KFQ| 10%|
            \n10000 KFQ| 15%|
            \n21000 KFQ| 25%
            \n
            \n
            \n<center><h1>Why Kief Tokens?</h1></center>
            \n
            \n- This in-game currency has a very low supply of 4.2 million which makes it extremely rare and the value of in-game items are determined by the market.
            \n 
            \n- Staking KFQ is the only way to become a board member with a minimum entry of 21,000. 
            \n
            \n- HashKings is a top 100 dApp out of 2500+ according to [Stateofthedapps.com](https://www.stateofthedapps.com).  
            \nd supply** once they are gone the only way to purchase them is on an exchange. 
            \n
            \n- We are partnered with the #1 Cannabis Curation Trail and Community on STEEM, Canna-Curate.\n`
            var footer = `\n<center><h1>Hashkings Official Links</h1></center>
            \n
            \n<center>[Hashkings Web App](https://www.hashkings.app)    
            \n[Hashkings Discord](https://discord.gg/QW6tWF9)      
            \n[Hashkings Github Repository](https://github.com/dpdanpittman/Hashkings-2D-UI)</center>
            \n
            \n        
            \n<center>![divider.png](https://smoke.io/imageupload_data/ee12bc223b16e8b3b16671dc95795f597b986400)</center>
            \n        
            \n<center><h1>STEEM Community Showcase</h1></center>
            \n
            \n       
            \nWe love community and the [Canna-Curate Server](https://discord.gg/DcsPHUG) has the most knowledgeable growers and smokers on the Blockchain.  Stop by and stay a while, spark up a bowl and chat with some of the members.
            \n
            \n<center>
            \n<a href="https://discord.gg/DcsPHUG"><img src="https://steemitimages.com/640x0/https://cdn.steemitimages.com/DQmV9PhMNu2JaR9BEJFhSdxjd4SA7nWj7yG131z9sRRYHJc/JPEG_20180729_131244.jpg"></center>
            \n
            \n***canna-curate | The #1 Cannabis Curation Trail on STEEM***
            \n
            \n       
            \n### Read what our farmers have to say [here](https://steempeak.com/hashkings/@chronocrypto/invest-in-the-game-and-get-beneficiary-rewards-hashkings) and please don't hesitate to reach out in the comments below!
            \n`
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
    }
        if (num % 28800 === 25300 && state.payday && state.payday.length) {
    state.refund.push(['sign',[["vote",{"author":streamname,"permlink":`h${num-300}`,"voter":username,"weight":10000}]]])
    }
        if (num % 28800 === 22000 && state.payday[0].length) {
            state.payday[0] = sortExtentions(state.payday[0],'account')
        var body = `\nhttps://i.imgur.com/jTxih7O.png\n
            \n<center><h1>What is Kief?</h1></center>
            \n
            \n>Ever wonder what to call all those tiny, sticky crystals that cover cannabis flower? They’re called kief, also known as dry sift or pollen.
            \n>
            \n>Kief refers to the resin glands which contain the terpenes and cannabinoids that make cannabis so unique. While marijuana sans kief still contains cannabinoids, the resin glands that develop on flower buds pack the biggest punch.*
            \n>
            \n><h8>_Source: [Leafly](https://www.leafly.com)_</h8>
            \n
            \n***The Kief(KFQ) in-game currency is just that, a sticky terpene filled resin gland loaded with cannabanoids aka, The Life Blood of HashKings.***
            \n
            \n
            \n<center><h1>Kief Specs</h1></center>
            \n
            \n**Total Supply: 4,200,000 KFQ**
            \n**Decimals: 8**
            \n
            \n<u>Distribution</u>|<u>Capabilities</u>|
            \n-|-|
            \nAirdrop: 444,719 KFQ| Staking|
            \nDev Fund: 15%| Mining|
            \n60/40 Split: 1,680,000 KFQ (Locked)|	|
            \nAvailable: 1,697,281 KFQ| |
            \n
            \n
            \n<center><h1>What is Kief Token(KFQ) used for?</h1></center>
            \n
            \n<h4><u>In-Game Currency</u></h4>
            \nKief is an in-game currency used to buy nutrients, greenhouses, soil and various farm equipment.
            \n
            \n<h4><u>Staking</u></h4>
            \nKief can also be used to help the HashKings Economy by becoming an active participant in the survival of the Game.  Stake your tokens to earn many of the benefits listed in the next section.
            \n
            \n
            \n<center><h1>What are the benefits of Kief Token?</h1></center>
            \n<h4>Farmers Association Board</h4>
            \n
            \nBecome a board member and vote on important decisions in the HashKings ecosystem. The minimum stake for applying to become part of the board is 21,000 KFQ.
            \n
            \nDuties of the Board Members include but are not limited to
            \n- Voting on Strains
            \n- Voting on Regions
            \n- Voting on HashKings Features
            \n- Voting on Item Prices
            \n
            \n<h4>Staking Rewards</h4>
            \n
            \nStaking is the easiest way to earn KFQ has a 4 week cooldown period and rewards are halved every 100,000 Kief Tokens.
            \n
            \n_The table below describes the weekly payout._
            \n
            \nStaked Amount| Payout
            \n-|-
            \n500 KFQ| 10 KFQ
            \n1000 KFQ| 25 KFQ
            \n2500 KFQ| 50 KFQ
            \n5000 KFQ| 100 KFQ
            \n10000 KFQ| 200 KFQ
            \n21000 KFQ | 500 KFQ
            \n
            \n<h4>Discounts</h4>
            \n
            \nStaking the tokens earns you discounts in the HashKings Dispensary.
            \n
            \n<u>Staked Amount</u>|<u>Discount</u>|
            \n-|-|
            \n1000  KFQ| 1%|
            \n2500  KFQ| 5%|
            \n5000  KFQ| 10%|
            \n10000 KFQ| 15%|
            \n21000 KFQ| 25%
            \n
            \n
            \n<center><h1>Why Kief Tokens?</h1></center>
            \n
            \n- This in-game currency has a very low supply of 4.2 million which makes it extremely rare and the value of in-game items are determined by the market.
            \n 
            \n- Staking KFQ is the only way to become a board member with a minimum entry of 21,000. 
            \n
            \n- HashKings is a top 100 dApp out of 2500+ according to [Stateofthedapps.com](https://www.stateofthedapps.com).  
            \n
            \n- **Limited supply** once they are gone the only way to purchase them is on an exchange. 
            \n
            \n- We are partnered with the #1 Cannabis Curation Trail and Community on STEEM, Canna-Curate.\n`
            var footer = `\n<center><h1>Hashkings Official Links</h1></center>
            \n
            \n<center>[Hashkings Web App](https://www.hashkings.app)    
            \n[Hashkings Discord](https://discord.gg/QW6tWF9)      
            \n[Hashkings Github Repository](https://github.com/dpdanpittman/Hashkings-2D-UI)</center>
            \n
            \n        
            \n<center>![divider.png](https://smoke.io/imageupload_data/ee12bc223b16e8b3b16671dc95795f597b986400)</center>
            \n        
            \n<center><h1>STEEM Community Showcase</h1></center>
            \n
            \n       
            \nWe love community and the [Canna-Curate Server](https://discord.gg/DcsPHUG) has the most knowledgeable growers and smokers on the Blockchain.  Stop by and stay a while, spark up a bowl and chat with some of the members.
            \n
            \n<center>
            <a href="https://discord.gg/DcsPHUG"><img src="https://steemitimages.com/640x0/https://cdn.steemitimages.com/DQmV9PhMNu2JaR9BEJFhSdxjd4SA7nWj7yG131z9sRRYHJc/JPEG_20180729_131244.jpg"></center>
            \n
            \n***canna-curate | The #1 Cannabis Curation Trail on STEEM***
            \n
            \n       
            \n### Read what our farmers have to say [here](https://steempeak.com/hashkings/@chronocrypto/invest-in-the-game-and-get-beneficiary-rewards-hashkings) and please don't hesitate to reach out in the comments below!
            \n`
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
    }
    if (num % 28800 === 22300) {
    state.refund.push(['sign',[["vote",{"author":streamname,"permlink":`h${num-300}`,"voter":username,"weight":10000}]]])
    }
        if (num % 28800 === 28750) {
            state.payday = whotopay()
        }
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
    // search for qwoyn_harvest from user on blockchain since genesis
    processor.on('harvest', function(json, from) {
        let plants = json.plants,
            plantnames = ''
        for (var i = 0; i < plants.length; i++) {
            try {
            if (state.land[plants[i]].owner === from) {
                state.land[plants[i]].care.unshift([processor.getCurrentBlockNumber(), 'harvested']);
                plantnames += `${plants[i]} `
            }
            } catch (e){
              state.cs[`${json.block_num}:${from}`] = `${from} can't harvest what is not theirs`
            }
        }
        state.cs[`${json.block_num}:${from}`] = `${from} harvested ${plantnames}`
    });
    
    // search for qwoyn_water from user on blockchain since genesis
    processor.on('water', function(json, from) {
        let plants = json.plants,
            plantnames = ''
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
        state.cs[`${json.block_num}:${from}`] = `${from} watered ${plantnames}`
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
             
                state.users[from].pollen.splice(i, 1)[0];
                state.land[plants].pollinated = true;
                state.land[plants].father = pollenName;       
            }
            } catch (e){
              state.cs[`${json.block_num}:${from}`] = `${from} can't water what is not theirs`
            }
        }
        state.cs[`${json.block_num}:${from}`] = `${from} pollinated ${plantnames} with ${pollenName}`
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

    processor.on('patreon_tier3', function(json, from) {

        if (!state.users[json.delegator] && json.to == username) state.users[json.delegator] = {
        addrs: [],
        seeds: [],
        pollen: [],
        buds: [],
        inv: [],
        stats: [],
        traits:[],
        terps:[],
        v: 0
        }
        
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
    
    processor.on('news', function(json, from) {
        if(from=='hashkings'){
            if(!state.news){
                state.news = {a:[],b:[],c:[],d:[],f:[],g:[],h:[],i:[],t:[]}
            }
            state.news[json.queue].push(json.body)
         }
    });

    processor.on('give_seed', function(json, from) {
        var seed=''
        if(json.to && json.to.length > 2){
          try{
              for (var i = 0;i < state.users[from].seeds.length; i++){
                  if (json.qual){
                    if(state.users[from].seeds[i].strain === json.seed && state.users[from].seeds[i].xp == json.qual){
                      seed=state.users[from].seeds.splice(i, 1)[0]
                      break
                    }
                  } else if(state.users[from].seeds[i].strain === json.seed){
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
                  inv: [],
                  stats: [],
                  terps: [],
                  traits: [seed.traits],
                  pollinated: false,
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

    //send pollen
    processor.on('give_pollen', function(json, from) {
        var pollen = ''
        if(json.to && json.to.length > 2){
          try{
              for (var i = 0;i < state.users[from].pollen.length; i++){
                  if (json.qual){
                    if(state.users[from].pollen[i].strain == json.pollen && state.users[from].pollen[i].xp == json.qual){
                      pollen = state.users[from].pollen.splice(i, 1)[0]
                      break
                    }
                  } else if(state.users[from].pollen[i].strain === json.pollen){
                    pollen = state.users[from].pollen.splice(i, 1)[0]
                    break
                  }
              }
          } catch (e) {}
          if (pollens) {
              if (!state.users[json.to]) {
                state.users[json.to] = {
                  addrs: [],
                  seeds: [],
                  buds: [],
                  pollen: [pollens],
                  inv: [],
                  stats: [],
                  terps: [],
                  traits: [pollens.traits],
                  pollinated: false,
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

    
   //send buds
    processor.on('give_buds', function(json, from) {
        var buds = ''
        if(json.to && json.to.length > 2){
          try{
              for (var i = 0;i < state.users[from].buds.length; i++){
                  if (json.qual){
                    if(state.users[from].buds[i].strain == json.buds && state.users[from].buds[i].xp == json.qual){
                        buds = state.users[from].buds.splice(i, 1)[0]
                      break
                    }
                  } else if(state.users[from].buds[i].strain == json.buds){
                    buds = state.users[from].buds.splice(i, 1)[0]
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
                  buds: [buds],
                  inv: [],
                  stats: [],
                  terps: [buds.terps],
                  traits: [buds.traits],
                  pollinated: false,
                  v: 0
                }
              } else {
                  state.users[json.to].buds.push(bud)
              }
              state.cs[`${json.block_num}:${from}`] = `${from} sent ${buds.strain} buds to ${json.to}`
          } else {
              state.cs[`${json.block_num}:${from}`] = `${from} doesn't own those buds`
          }
        }
    });

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
                state.land[json.addr].traits = seed.traits || []
                state.land[json.addr].terps = seed.terps || []
                state.land[json.addr].planted = processor.getCurrentBlockNumber()
                state.land[json.addr].stage = 1
                state.land[json.addr].substage = 0
                state.land[json.addr].pollinated = seed.pollinated
                state.land[json.addr].father = seed.father
            } else {
                state.users[from].seeds.unshift(seed);
                state.cs[`${json.block_num}:${from}`] = `${from} can't plant that.`
            }
        } else if (seed) {
            state.users[from].seeds.unshift(seed);
            state.cs[`${json.block_num}:${from}`] = `${from} doesn't own that plot`
        } else {
            state.cs[`${json.block_num}:${from}`] = `${from} did something unexpected with a plant!`
        }
    });

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

    processor.onOperation('delegate_vesting_shares', function(json, from) { //grab posts to reward
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
        inv: [],
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
    processor.onOperation('transfer', function(json) {
        var wrongTransaction = 'qwoyn'
        if (json.to == username && json.amount.split(' ')[1] == 'STEEM') {
            const amount = parseInt(parseFloat(json.amount) * 1000)
            fetch(`http://blacklist.usesteem.com/user/${json.from}`)
            .then(function(response) {
                return response.json();
            })
            .then(function(myJson) {
                if(myJson.blacklisted.length == 0 || json.from == 'news-today'){
                    if (!state.users[json.from]) state.users[json.from] = {
                addrs: [], 
                seeds: [],
                pollen: [],
                buds: [],
                inv: [],
                stats: [],
                traits:[],
                terps:[],
                v: 0,
                a: 0,
                u: 0
            }
            var want = json.memo.split(" ")[0].toLowerCase() || json.memo.toLowerCase(),
                type = json.memo.split(" ")[1] || ''
            if (state.stats.prices.listed[want] == amount || amount == 500 && type == 'manage' && state.stats.prices.listed[want] || want == 'rseed' && amount == state.stats.prices.listed.seeds.reg || want == 'mseed' && amount == state.stats.prices.listed.seeds.mid || want == 'tseed' && amount == state.stats.prices.listed.seeds.top || want == 'spseed' && amount == state.stats.prices.listed.seeds.special) {
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
                        const c = parseInt(amount * 0.025)
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
                        state.cs[`${json.block_num}:${json.from}`] = `${json.from} purchased land at plot # ${addr}`
                    } else {
                        state.refund.push(['xfer', json.from, amount, 
                        '<h3>Automated Hashkings Response</h3>\nThanks for trying to lease a plot on Hashkings but it looks like you have used' + state.delegations.owner[json.from].used + 'out of' + state.delegations.owner[json.from].used + 'plot credits and may need to delegate more STEEM POWER. Please return to the [Hashkings Market](https://www.hashkings.app/markets) to delegate more SP\nIf you feel this is an error please contact our DEV TEAM in our [Discord Server](https://discord.gg/xabv5az)\n<h5>Thank you so much for you support!</h5>\n<a href="https://www.hashkings.app"><img src="https://i.imgur.com/MQYSNVK.png"></a>'])
                    }
                } else if (want == 'rseed' && amount == state.stats.prices.listed.seeds.reg || want == 'mseed' && amount == state.stats.prices.listed.seeds.mid || want == 'tseed' && amount == state.stats.prices.listed.seeds.top || want == 'spseed' && amount == state.stats.prices.listed.seeds.special) {
                    if (state.stats.supply.strains.indexOf(type) < 0){ type = state.stats.supply.strains[state.users.length % (state.stats.supply.strains.length -1)]}
                    var xp = 1
                    if (want == 'mseed') xp = 10
                    if (want == 'tseed') xp = 50
                    if (want == 'spseed') xp = 200
                    var seed = {
                        strain: type,
                        xp: xp
                    }
                    state.users[json.from].seeds.push(seed)
                    const c = parseInt(amount * 0.1)
                    state.bal.c += c
                    state.bal.b += amount - c
                    state.cs[`${json.block_num}:${json.from}`] = `${json.from} purchased ${seed.strain}`
                } else {
                    state.bal.r += amount
                    state.refund.push(['xfer', wrongTransaction, amount, json.from + ' sent a weird transfer...refund?'])
                    state.cs[`${json.block_num}:${json.from}`] = `${json.from} sent a weird transfer...please check wallet`
                }
            } else if (amount > 10) {
                state.bal.r += amount
                state.refund.push(['xfer', wrongTransaction, amount, json.from + ' sent a weird transfer...refund?'])
                state.cs[`${json.block_num}:${json.from}`] = `${json.from} sent a weird transfer...please check wallet`
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

function autoPoster (loc, num) {
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
}

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

    sex = state.land.length % 1;

    if(sex > 0){
        sexAtBirth = "male";
    } else{
        sexAtBirth = "female";
    }
    return sexAtBirth
}

function daily(addr) {
    var grown = false, harvested = false
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
                        state.land[addr].stage = -1;
                        break;
                    }
                } catch(e) {
                    console.log('An affliction happened', e.message)
                   }
                }
//              if json is pollinated and plant is stage 3 or greater then give kudos, pollinate plant and set father
            } else if (state.land[addr].care[i][0] > processor.getCurrentBlockNumber() - 28800 && state.land[addr].care[i][1] == 'pollinated' && state.land[addr].stage > 2) {
                kudo(state.land[addr].owner);
            }
                //female harvested pollinated plant
                try {
              if (state.land[addr].care[i][1] == 'harvested' && state.land[addr].sex == 'female' && state.land[addr].pollinated == true){
                if (!harvested && state.land[addr].stage > 3){
                  harvested = true
                  kudo(state.land[addr].owner)
                  const seed = {
                      strain: state.land[addr].strain,
                      xp: state.land[addr].xp,
                      traits: ['beta pollinated seed'],
                      terps: [],
                      //familyTree: state.land[addr].strain + '' + state.land[addr].pollen,
                      pollinated: false,
                      father: state.land[addr].pollen
                  }
                  const seed2 = {
                      strain: state.land[addr].strain,
                      xp: state.land[addr].xp,
                      traits: ['beta pollinated seed'],
                      terps: [],
                      //familyTree: state.land[addr].strain + '' + state.land[addr].pollen,
                      pollinated: false,
                      father: state.land[addr].pollen
                  }
                  state.users[state.land[addr].owner].seeds.push(seed)

                  state.users[state.land[addr].owner].seeds.push(seed2)

                  const parcel = {
                      owner: state.land[addr].owner,
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
                  state.land[addr] = parcel
                  
                }}
                } catch(e) {
                    console.log('', e.message)
                   }
                   
                   //harvest buds if female not pollinated
                   try {
                    if (state.land[addr].care[i][1] == 'harvested' && state.land[addr].sex == 'female' && state.land[addr].pollinated == false){
                      if (!harvested && state.land[addr].stage > 3){
                        harvested = true
                        kudo(state.land[addr].owner)
                        const bud1 = {
                            strain: state.land[addr].strain,
                            xp: state.land[addr].xp,
                            traits: ['Beta Buds'],
                            terps: [state.land[addr].strain.terps],
                            familyTree: state.land[addr].strain,
                            father: 'Sensimilla'
                        }
                        const bud2 = {
                            strain: state.land[addr].strain,
                            xp: state.land[addr].xp,
                            traits: ['Beta Buds'],
                            terps: [],
                            familyTree: state.land[addr].strain,
                            father: 'Sensimilla'
                        }

                        state.users[state.land[addr].owner].buds.push(bud1)
                        state.users[state.land[addr].owner].buds.push(bud2)
      
                        const parcel = {
                            owner: state.land[addr].owner,
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
                        state.land[addr] = parcel
                        
                      }}
                      } catch(e) {
                          console.log('buds harvested', e.message)
                         }
                         

                //pollen at harvest if male
                try {
              if (state.land[addr].care[i][1] == 'harvested' && state.land[addr].sex == 'male'){
                if (!harvested && state.land[addr].stage > 3){
                  harvested = true
                  kudo(state.land[addr].owner)
                  const pollen1 = {
                      strain: state.land[addr].strain,
                      xp: state.land[addr].xp,
                      traits: ['Beta Pollen'],
                      terps: [],
                      familyTree: state.land[addr].strain,
                      father: 'Sensimilla'
                  }
                  const pollen2 = {
                      strain: state.land[addr].strain,
                      xp: state.land[addr].xp,
                      traits: ['Beta Pollen'],
                      terps: [],
                      familyTree: state.land[addr].strain,
                      father: 'Sensimilla'
                  }
                  state.users[state.land[addr].owner].pollen.push(pollen1)

                  state.users[state.land[addr].owner].pollen.push(pollen2)

                  const parcel = {
                      owner: state.land[addr].owner,
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
                  state.land[addr] = parcel
                  
                }}
                } catch(e) {
                    console.log('pollen harvested', e.message)
                   }
            }
                }
            }