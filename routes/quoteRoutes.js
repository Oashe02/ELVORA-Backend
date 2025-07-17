import express from "express";
import  {handleQuoteForm}  from "../controller/quoteController.js";
import multer from "multer";

const router = express.Router();
const upload = multer(); // memory storage for buffer file

router.post("/quote", upload.single("file"), handleQuoteForm);

export default router;
