import axios from "axios";
import OAuth from "oauth-1.0a";
import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();

type Tweet = {
  id: string;
  text: string;
};

type TweetSearchResponse = {
  data: Array<Tweet>;
};

const queryOptions = [
  "rotina de skincare",
  "sabonete facial",
  "protetor solar",
  "hidratante facial",
  "hidratante corporal",
  "dica de beleza",
  "pele oleosa",
  "pele mista",
  "pele ressecada",
  "meu perfume",
  "pele glow",
  "cuidar da pele",
  "lavar o rosto",
  "vitamina C rosto",
  "hidratar cabelo",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const api_key = process.env.KEY || "";
  const secret = process.env.SECRET || "";

  const oauth = new OAuth({
    consumer: {
      key: api_key,
      secret: secret,
    },
    signature_method: "HMAC-SHA1",
    hash_function: (baseString, key) =>
      crypto.createHmac("sha1", key).update(baseString).digest("base64"),
  });

  const token = {
    key: process.env.ACCESS_TOKEN || "",
    secret: process.env.ACCESS_SECRET || "",
  };

  const endpointURL = `https://api.twitter.com/2/users/1519739045282295809/likes`;

  const likeauthHeader = oauth.toHeader(
    oauth.authorize(
      {
        url: endpointURL,
        method: "POST",
      },
      token
    )
  );

  let requestsMade = 0;
  while (true) {
    if (requestsMade >= 1000) {
      let diff = Date.now() - new Date().setHours(0, 0, 0, 0);
      let diffHours = 24 - Math.floor(diff / (1000 * 60 * 60));
      let sleepTime = diffHours * 60 * 60 * 1000;

      await sleep(sleepTime);
      requestsMade = 0;
      console.log("1000 requests made... Sleeping until 00:00.");
      continue;
    }

    let rng = Math.floor(Math.random() * queryOptions.length);
    console.log(`Querying for tweets with "${queryOptions[rng]}" in them...`);
    const response = await axios.get<TweetSearchResponse>(
      `https://api.twitter.com/2/tweets/search/recent?query=${queryOptions[rng]}&max_results=50`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BEARER || ""}`,
        },
      }
    );

    const tweets = response.data;

    tweets.data.forEach(async (tweet) => {
      try {
        const likeResponse = await axios.post(
          endpointURL,
          {
            tweet_id: tweet.id,
          },
          {
            headers: {
              Authorization: likeauthHeader["Authorization"],
              "content-type": "application/json",
              accept: "application/json",
            },
          }
        );

        if (response.status === 429) {
          let diff = Date.now() - new Date().setHours(0, 0, 0, 0);
          let diffHours = 24 - Math.floor(diff / (1000 * 60 * 60));
          let sleepTime = diffHours * 60 * 60 * 1000;

          await sleep(sleepTime);
          requestsMade = 0;
          console.log("1000 requests made... Sleeping until 00:00.");
        }

        if (likeResponse.data.data.liked) {
          requestsMade++;
          console.log(`Liked tweet of id [${tweet.id}]`);
          return;
        }

        console.log(`Failed to like tweet of id [${tweet.id}]`);
        return;
      } catch (e) {
        console.log(e);
      }
    });

    await sleep(15 * 60 * 1000);
  }
}

main();
