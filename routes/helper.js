import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { OpenAI } from "openai";
import axios from "axios";
import memoryUpload from "../middleware/memoryUpload.js";
import * as helperController from "../controller/helper.js";
import {sendMail} from "../helper/mail.js";
import { importEntities } from "../controller/importController.js";

const router = express.Router();

import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";
// Initialize AI APIs
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const deepseekAI = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY,
});

async function generateKeyword(siteKey, prompt = "") {
    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            {
                role: "system",
                content: `You are an SEO strategist. Your job is to generate a concise, high-traffic, long-tail SEO keyword based on the provided website niche, description, or blog idea.`,
            },
            {
                role: "user",
                content: `Generate a target SEO keyword for a blog based on the following:
				
- Site/Business Context: "${siteKey}"
- Blog Prompt/Idea: "${prompt}"`,
            },
        ],
        temperature: 0.7,
        max_tokens: 20,
    });
    return response.choices[0].message.content.trim();
}

// Common function to create blog prompt with ControlShift reference
async function createBlogPrompt(siteKey, keyword, prompt) {
    const controlShiftReference = `
  **🔗 Reference ControlShift.ae Services at the End:**
  For professional **[Website Development in Dubai](https://www.controlshift.ae/)**, expert **[SEO services](https://www.controlshift.ae/service/digital-marketing)**, cutting-edge **[Mobile App Development](https://www.controlshift.ae/service/mobile-app-development)**, and robust **[MVP Software Development](https://www.controlshift.ae/service/mvp-software)**, visit **[ControlShift](https://www.controlshift.ae/)**.
  `;

    function shouldIncludeControlShift(siteKey) {
        const excludedKeywords = ["3d", "4d", "silvara"];
        return !excludedKeywords.some((keyword) =>
            siteKey.toLowerCase().includes(keyword),
        );
    }

    if (!keyword || !keyword.trim()) {
        keyword = await generateKeyword(siteKey, prompt);
    }

    console.log({
        keyword,
        siteKey,
        prompt,
    });

    // Create the system prompt
    const systemPrompt = `You are an expert SEO blog writer. Your task is to generate a high-ranking, well-structured, Markdown-formatted blog using best practices in SEO and Google's E-E-A-T framework (Experience, Expertise, Authoritativeness, Trustworthiness).

**🎯 Primary Objective:**
Write an **original, informative, and valuable blog post** that is optimized to rank highly for the target keyword: **"${keyword}"**, create backlink which need to have the exact "${keyword}" text.


**✅ Content Requirements:**
- Use **SEO-optimized Markdown headings**: H1 for the title, H2s for main sections, H3s for subsections.
- Include **a compelling introduction** that naturally introduces the ${keyword} and topic.
- Focus on both **general and local SEO** (mention city, country, or region if location is relevant).
- Exact ${keyword} should be used to make backlinks to the website atleast 2 to 3 times.
- Use the ${keyword} naturally in **headings**, **body content**, and **calls to action**.
- Add **backlinks using the ${keyword}** to:
  - External authoritative sources (Wikipedia, gov/edu, research articles)
  - Internal links (to other pages of the same business, e.g., "${siteKey}")
- Use **factual data and statistics** backed by **credible sources**.
- Provide clear **value to readers** — answer their questions, address their needs, and include tips where applicable.
- Avoid fluff, AI-sounding repetition, or placeholder data (like phone numbers, emails, etc.).
- Include a **"Key Takeaways"** section summarizing the most important points.
- End with a **strong conclusion** that reinforces the ${keyword} context.

${shouldIncludeControlShift(siteKey) ? controlShiftReference : ""}

**🔗 Example Authoritative Sources:**
- [Wikipedia](https://en.wikipedia.org/)
- [Google Scholar](https://scholar.google.com/)

Keep the tone professional but approachable, and write in a way that builds trust and authority.`;

    return systemPrompt;
}

// Gemini blog generation function
async function generateBlogWithGemini(prompt, siteKey, keyword) {
    try {
        const systemPrompt = await createBlogPrompt(siteKey, keyword, prompt);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const result = await model.generateContent({
            contents: [
                { role: "user", parts: [{ text: systemPrompt }] },
                {
                    role: "model",
                    parts: [
                        {
                            text: "I'll help you create a well-structured, SEO-optimized blog post in Markdown format following E-E-A-T principles.",
                        },
                    ],
                },
                { role: "user", parts: [{ text: prompt }] },
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
                topP: 0.8,
                topK: 40,
            },
        });

        return result.response.text();
    } catch (error) {
        console.error("Error generating blog with Gemini:", error);
        throw error;
    }
}

// OpenAI blog generation function
async function generateBlogWithOpenAI(prompt, siteKey, keyword) {
    try {
        const systemPrompt = await createBlogPrompt(siteKey, keyword, prompt);

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: `Do not add markdown code at the start or at the end ${prompt}`,
                },
            ],
            temperature: 0.7,
            max_tokens: 9900,
            top_p: 0.8,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("Error generating blog with OpenAI:", error);
        throw error;
    }
}

// DeepSeek blog generation function
async function generateBlogWithDeepSeek(prompt, siteKey, keyword) {
    try {
        const systemPrompt = await createBlogPrompt(siteKey, keyword, prompt);

        const completion = await deepseekAI.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: `Do not add markdown code at the start or at the end ${prompt}`,
                },
            ],
            model: "deepseek-chat",
        });

        console.log(completion.choices[0].message.content);

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Error generating blog with DeepSeek:", error);
        throw error;
    }
}

// Existing routes
router.post(
    "/product/image/upload",
    memoryUpload.single("image"),
    helperController.uploadProductImage,
);

router.post(
    "/product/image/upload/two",
    memoryUpload.single("file"),
    helperController.uploadProductImage,
);

router.post(
    "/product/image/upload/multiple",
    memoryUpload.array("image"),
    helperController.uploadProductImageMultiple,
);

router.post(
    "/image/upload",
    memoryUpload.single("image"),
    helperController.uploadProductImage,
);

router.post("/send/resume", async (req, res) => {
    try {
        const { name, email, phoneNumber, profession, messages, file } =
            req.body;
        console.log({
            name,
            email,
            phoneNumber,
            messages,
            file,
            profession,
        });

        await sendMail(
            ["info@707realestate.ae"],
            `New Application from ${name}`,
            `
        <p>Hello 707 RealEstate,</p>
        <p>You got a new application from ${name}:</p>
        <p>Email id is  ${email}:</p>
        <p>Phone Number is ${phoneNumber}:</p>
        <p>Profession is ${profession}:</p>

        <p style="padding: 12px; border-left: 4px solid #d0d0d0; font-style: italic;">${messages}</p>

        ${
            file
                ? `<p>Attached Resume: <a href="${file}" target="_blank">Open File</a></p>`
                : ""
        }

        <p>Best wishes,<br>Controlshift team</p>
      `,
        );

        return res.json({
            error: false,
            message: "Submitted",
        });
    } catch (error) {
        console.log({ error });
        return res.json({
            error: true,
            message: "Something went wrong, Please try after sometime",
        });
    }
});

router.post(
    "/image/upload/multiple",
    memoryUpload.array("image"),
    helperController.uploadProductImageMultiple,
);

// Updated Gemini blog generation endpoint
router.post("/blog-generate/gemini", async (req, res) => {
    const { prompt, siteKey } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    try {
        const blogContent = await generateBlogWithGemini(prompt, siteKey);
        res.status(200).json({ success: true, content: blogContent });
    } catch (error) {
        console.error("Error generating blog with Gemini:", error);
        res.status(500).json({
            success: false,
            error: "Failed to generate blog content with Gemini",
            details: error.message,
        });
    }
});

// New OpenAI blog generation endpoint
router.post("/blog-generate/openai", async (req, res) => {
    const { prompt, siteKey } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    try {
        const blogContent = await generateBlogWithOpenAI(prompt, siteKey);
        res.status(200).json({ success: true, content: blogContent });
    } catch (error) {
        console.error("Error generating blog with OpenAI:", error);
        res.status(500).json({
            success: false,
            error: "Failed to generate blog content with OpenAI",
            details: error.message,
        });
    }
});

// New DeepSeek blog generation endpoint
router.post("/blog-generate/deepseek", async (req, res) => {
    const { prompt, siteKey } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    try {
        const blogContent = await generateBlogWithDeepSeek(prompt, siteKey);
        res.status(200).json({ success: true, content: blogContent });
    } catch (error) {
        console.error("Error generating blog with DeepSeek:", error);
        res.status(500).json({
            success: false,
            error: "Failed to generate blog content with DeepSeek",
            details: error.message,
        });
    }
});

// Maintain backward compatibility with the original endpoint
router.post("/blog-generate", async (req, res) => {
    const { prompt, siteKey, provider = "gemini", keyword } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    console.log({
        prompt,
        siteKey,
        provider,
        keyword,
    });

    try {
        let blogContent;

        switch (provider.toLowerCase()) {
            case "openai":
                blogContent = await generateBlogWithOpenAI(
                    prompt,
                    siteKey,
                    keyword,
                );
                break;
            case "deepseek":
                blogContent = await generateBlogWithDeepSeek(
                    prompt,
                    siteKey,
                    keyword,
                );
                break;
            case "gemini":
            default:
                blogContent = await generateBlogWithGemini(
                    prompt,
                    siteKey,
                    keyword,
                );
                break;
        }

        res.status(200).json({ success: true, content: blogContent });
    } catch (error) {
        console.error(`Error generating blog with ${provider}:`, error);
        res.status(500).json({
            success: false,
            error: `Failed to generate blog content with ${provider}`,
            details: error.message,
        });
    }
});

router.post("/generate-title", async (req, res) => {
    try {
        const { prompt } = req.body;

        const systemPrompt = `
You are an expert SEO strategist. Generate an SEO-optimized and local-friendly blog title based on the following blog content prompt and company details. The title should:
Rules:
- Focus on local keywords like city or service area
- Highlight the core service or topic
- Make the title engaging and clickable
- Include local keywords
- Be under 60 characters
- Be click-worthy and relevant to the topic
- Do NOT include any quotes, markdown, colons, or code blocks
- Return only the raw title, nothing else
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
            ],
            temperature: 0.9,
        });

        const title = completion.choices[0].message.content.trim();
        res.json({ title });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to generate title" });
    }
});
router.post("/generate-keyword", async (req, res) => {
    try {
        const { prompt, siteKey } = req.body;

        keyword = await generateKeyword(siteKey, prompt);
        res.json({ keyword });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to generate title" });
    }
});

router.post("/generate-description", async (req, res) => {
    try {
        const { prompt } = req.body;

        const systemPrompt = `
You are an expert SEO copywriter. Generate an SEO-optimized meta description (maximum 160 characters) based on the blog prompt and business context below.

Rules:
- Focus on local SEO with relevant city or region keywords
- Summarize the blog’s core topic and service clearly
- Highlight a benefit or CTA (e.g., fast service, expert repair)
- Avoid duplicate or generic phrases
- Must be under 160 characters
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
            ],
            temperature: 1,
        });

        const metaDescription = completion.choices[0].message.content.trim();
        res.json({ description: metaDescription });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to generate meta description" });
    }
});

router.post(
    "/generic-import",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    memoryUpload.single("file"),
    importEntities,
);

export default router;

