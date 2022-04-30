import axios from "axios";
import OAuth from "oauth-1.0a";
import dotenv from "dotenv";
import crypto from "crypto";
import { time } from "console";
dotenv.config();

// type OAuthTokenResponse = {
//   oauth_token: string;
//   oauth_token_secret: string;
// };

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
  "cravos",
  "neutrogena",
  "cuidar da pele",
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

    const likeResponse = await axios.post(
      endpointURL,
      {
        tweet_id: tweets.data[0].id,
      },
      {
        headers: {
          Authorization: likeauthHeader["Authorization"],
          "content-type": "application/json",
          accept: "application/json",
        },
      }
    );

    // tweets.data.forEach(async (tweet) => {
    //   const likeResponse = await axios.post(
    //     endpointURL,
    //     {
    //       tweet_id: tweet.id,
    //     },
    //     {
    //       headers: {
    //         Authorization: likeauthHeader["Authorization"],
    //         "content-type": "application/json",
    //         accept: "application/json",
    //       },
    //     }
    //   );

    //   if (likeResponse.data.liked) {
    //     requestsMade++;
    //     console.log(`Liked tweet of id [${tweet.id}]`);
    //     return;
    //   }

    //   console.log(`Failed to like tweet of id [${tweet.id}]`);
    //   return;
    // });

    // await sleep(15 * 60 * 1000);
  }
}

main();
