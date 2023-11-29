import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";
import { StringOutputParser } from "langchain/schema/output_parser";
import { retriever } from "./utils/retriever.js";
import { combineDocuments } from "./utils/combineDocuments.js";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "langchain/schema/runnable";
import { formatConvHistory } from "./utils/formatConvHistory.js";
import config from "./config.js";

document.addEventListener("submit", (e) => {
  e.preventDefault();
  progressConversation();
});

const openAIApiKey = config["OPENAI_API_KEY"];
const llm = new ChatOpenAI({ openAIApiKey });

const standaloneQuestionTemplate = `Given some conversation history (if any) and a question, convert the question to a standalone question. 
conversation history: {conv_history}
question: {question} 
standalone question:`;
const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
  standaloneQuestionTemplate
);

const answerTemplate = `You are a helpful and enthusiastic support bot who can answer a given question about Scrimba based on the context provided and the conversation history. Try to find the answer in the context. If the answer is not given in the context, find the answer in the conversation history if possible. If you really don't know the answer, say "I'm sorry, I don't know the answer to that." And direct the questioner to email help@scrimba.com. Don't try to make up an answer. Always speak as if you were chatting to a friend.
context: {context}
conversation history: {conv_history}
question: {question}
answer: `;
const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

const standaloneQuestionChain = standaloneQuestionPrompt
  .pipe(llm)
  .pipe(new StringOutputParser());

const retrieverChain = RunnableSequence.from([
  (prevResult) => prevResult.standalone_question,
  retriever,
  combineDocuments,
]);

const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser());

const chain = RunnableSequence.from([
  {
    standalone_question: standaloneQuestionChain,
    original_input: new RunnablePassthrough(),
  },
  {
    context: retrieverChain,
    question: ({ original_input }) => original_input.question,
    conv_history: ({ original_input }) => original_input.conv_history,
  },
  answerChain,
]);

const convHistory = [];

async function progressConversation() {
  const userInput = document.getElementById("user-input");
  const chatbotConversation = document.getElementById(
    "chatbot-conversation-container"
  );
  const question = userInput.value;
  userInput.value = "";

  // add human message
  const newHumanSpeechBubble = document.createElement("div");
  newHumanSpeechBubble.classList.add("speech", "speech-human");
  chatbotConversation.appendChild(newHumanSpeechBubble);
  newHumanSpeechBubble.textContent = question;
  chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
  const response = await chain.invoke({
    question: question,
    conv_history: formatConvHistory(convHistory),
  });
  convHistory.push(question);
  convHistory.push(response);

  // add AI message
  const newAiSpeechBubble = document.createElement("div");
  newAiSpeechBubble.classList.add("speech", "speech-ai");
  chatbotConversation.appendChild(newAiSpeechBubble);
  newAiSpeechBubble.textContent = response;
  chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
}

// // ###v3
// document.addEventListener("submit", (e) => {
//   e.preventDefault();
//   progressConversation();
// });

// const openAIApiKey = config["OPENAI_API_KEY"];

// async function progressConversation() {
//   const userInput = document.getElementById("user-input");
//   const chatbotConversation = document.getElementById(
//     "chatbot-conversation-container"
//   );
//   const question = userInput.value;
//   userInput.value = "";

//   // add human message
//   const newHumanSpeechBubble = document.createElement("div");
//   newHumanSpeechBubble.classList.add("speech", "speech-human");
//   chatbotConversation.appendChild(newHumanSpeechBubble);
//   newHumanSpeechBubble.textContent = question;
//   chatbotConversation.scrollTop = chatbotConversation.scrollHeight;

//   // add AI message
//   const newAiSpeechBubble = document.createElement("div");
//   newAiSpeechBubble.classList.add("speech", "speech-ai");
//   chatbotConversation.appendChild(newAiSpeechBubble);
//   newAiSpeechBubble.textContent = result;
//   chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
// }

// // ###v2
// // import config from "./config.js";
// // import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
// // import { TextLoader } from "langchain/document_loaders/fs/text";
// // import { createClient } from "@supabase/supabase-js";
// // import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
// // import { OpenAIEmbeddings } from "langchain/embeddings/openai";

// // try {
// //   const loader = new TextLoader("scrimba-info.txt");
// //   const text = await loader.load();
// //   //   const result = await fetch("scrimba-info.txt");
// //   //   const text = await result.text();

// //   const splitter = new RecursiveCharacterTextSplitter({
// //     chunkSize: 500,
// //     separators: ["\n\n", "\n", " ", ""], // default setting
// //     chunkOverlap: 50,
// //   });

// //   //   const output = await splitter.createDocuments([text]);
// //   const output = await splitter.splitDocuments(text);

// //   const sbApiKey = config["SUPABASE_API_KEY"];
// //   const sbUrl = config["SUPABASE_URL_LC_CHATBOT"];
// //   const openAIApiKey = config["OPENAI_API_KEY"];

// //   const client = createClient(sbUrl, sbApiKey);

// //   await SupabaseVectorStore.fromDocuments(
// //     output,
// //     new OpenAIEmbeddings({ openAIApiKey }),
// //     {
// //       client,
// //       tableName: "documents",
// //     }
// //   );

// //   console.log(output);
// // } catch (err) {
// //   console.log(err);
// // }

// // ### v1
// // // require("dotenv").config();

// // // // Import the mongoose module
// // // const mongoose = require("mongoose");

// // // // Set `strictQuery: false` to globally opt into filtering by properties that aren't in the schema
// // // // Included because it removes preparatory warnings for Mongoose 7.
// // // // See: https://mongoosejs.com/docs/migrating_to_6.html#strictquery-is-removed-and-replaced-by-strict
// // // mongoose.set("strictQuery", false);

// // // // Define the database URL to connect to.
// // // const mongoDB = process.env.DB_URI;

// // // // Wait for database to connect, logging an error if there is a problem
// // // main().catch((err) => console.log(err));
// // // async function main() {
// // //   await mongoose.connect(mongoDB);
// // //   console.log("connected to DB");
// // // }
