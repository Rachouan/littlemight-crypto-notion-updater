require("dotenv/config");
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
    getCryptoPrices();
    
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
            database[name].price = res.data['price'];

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
                    "number": parseFloat(database[name].price),
                },
            }};
            console.log(data);
            const res = await axios({
                method: 'patch',
                url: `https://api.notion.com/v1/pages/${database[name].page}`,
                responseType: 'json',
                headers,
                data:data
            });

            console.log(res.data.message)

        } catch (error) {
            console.log(error.response.data.message);
        }
        
    }
}

getDatabaseEntries();
