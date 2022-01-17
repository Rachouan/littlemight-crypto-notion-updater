require("dotenv/config");
const schedule = require('node-schedule');
const http = require('http');
const { Client } = require("@notionhq/client");
const axios = require('axios');
const notion = new Client({ auth: process.env.NOTION_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;
const database = {}
const headers = {
    'Notion-Version': '2021-05-13',
    'Authorization': `Bearer ${process.env.NOTION_KEY}`,
    'Content-Type': 'application/json'
}

async function getDatabaseEntries() {
  try {
      
    const res = await axios({
        method: 'post',
        url: `https://api.notion.com/v1/databases/${databaseId}/query`,
        responseType: 'json',
        headers
      })

    console.log(res.data)
    for(let el of res.data.results){
        database[el["properties"]["Name"]["title"][0]["text"]["content"]] = {'page': el["id"],"price": el["properties"]["Price/Coin"]["number"]};
        console.log(el["properties"]["Price/Coin"]);
    }
    console.log(database)
    
  } catch (error) {
    console.log(error.message);
  }
}

async function getCryptoPrices(){
    for(let name in database){
        try {
            const res = await axios({
                method: 'get',
                url: `https://api.binance.com/api/v3/avgPrice?symbol=${name}USDT`,
                responseType: 'json'
            });
            database[name].price = parseFloat(res.data['price'] ? res.data['price'] : 0);

        } catch (error) {
            console.log(error.message);
        }
        
    }
    console.log(database)
    updateNotionDatabase();
}

async function updateNotionDatabase(){
    for(let name in database){
        try {
            let data = {"properties": {
                "Price/Coin": {
                    "type": "number",
                    "number": parseFloat(database[name].price.toFixed(2)),
                },
            }};
            const res = await axios({
                method: 'patch',
                url: `https://api.notion.com/v1/pages/${database[name].page}`,
                responseType: 'json',
                headers,
                data:data
            });

            console.log('Update To =>' + res.data.properties['Price/Coin'].number)

        } catch (error) {
            console.log(error.message);
        }
        
    }
}

getDatabaseEntries();
getCryptoPrices();
const job = schedule.scheduleJob('* */1 * * *', function(){
  console.log('The answer to life, the universe, and everything!');
  getCryptoPrices();
});

http.createServer(function (req, res) {
    res.send('Hello World');
}).listen(8080);
