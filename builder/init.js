const axios = require("axios").default;
const path = require("path");
const fs = require("fs");
const setPic = require("./getPic");
const genIndex = require("./genIndex");
const {
  generateMarkupLocal,
  generateMarkupRemote,
} = require("./generateMarkup");

require("dotenv").config();

if (!process.env.NAME) throw new Error("Please specify NAME in environment.");
if (!process.env.PIC) throw new Error("Please specify PIC in environment.");

const picPath = process.env.PIC;
const msgPath = process.env.SCROLL_MSG;

//Local initialization
const setLocalData = async () => {
  try {
    const pic = path.join(__dirname, "../local/", picPath);
    let markup = "";
    if (msgPath) {
      const text = fs.readFileSync(path.join(__dirname, "../local/", msgPath), {
        encoding: "utf-8",
      });
      markup = generateMarkupLocal(text);
    }
    await setPic(pic);
    genIndex(markup);
  } catch (e) {
    throw new Error(e.message);
  }
};

//Remote initialization
const setRemoteData = async () => {
  try {
    let pic;
    let picUrl;
    try {
      picUrl = new URL(picPath);
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
    }
    if (picUrl) {
      const res = await axios.get(picUrl.href, {
        responseType: "arraybuffer",
      });
      pic = res.data;
    } else pic = path.join(__dirname, "../local/", picPath);
    let markup = "";
    if (msgPath) {
      const localMessagePath = path.join(__dirname, "../local/", msgPath);
      if (fs.existsSync(localMessagePath)) {
        markup = generateMarkupLocal(
          fs.readFileSync(localMessagePath, { encoding: "utf-8" })
        );
      } else {
        const article = msgPath.split("/").pop();
        const res = await axios.get(
          `https://api.telegra.ph/getPage/${article}?return_content=true`
        );
        const { content } = res.data.result;
        markup = content.reduce(
          (string, node) => string + generateMarkupRemote(node),
          ""
        );
      }
    }
    await setPic(pic);
    genIndex(markup);
  } catch (e) {
    throw new Error(e.message);
  }
};

if (process.argv[2] === "--local") setLocalData();
else if (process.argv[2] === "--remote") setRemoteData();
else console.log("Fetch mode not specified.");
