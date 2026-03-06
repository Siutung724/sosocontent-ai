/**
 * Google Apps Script Web App - AI Content Generator
 * 部署方法：Extensions -> App Script -> Deploy -> New Deployment -> Web App
 */

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const { brandName, productDescription, targetAudience, toneLevel, useCase } = requestData;

    // 從 Script Properties 讀取 API Key (Project Settings -> Script Properties)
    const scriptProperties = PropertiesService.getScriptProperties();
    const API_KEY = scriptProperties.getProperty('GEMINI_API_KEY') || scriptProperties.getProperty('AI_API_KEY');
    const API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    const toneMap = {
      0: "超貼地，好似老友係茶記吹水咁，可以用多啲潮流用語。",
      1: "輕鬆幽默，帶點玩味，適合同年輕人溝通。",
      2: "專業得嚟亦好親切，適合職場／中小企品牌。",
      3: "偏向正式，但仲係用廣東話繁體，保持品牌形象。"
    };

    const systemInstructions = `你是一位專門幫香港中小企寫文案的資深 Copywriter... (此處 Prompt 與 GCF 版本一致)`;
    const prompt = systemInstructions + "\n\n品牌: " + brandName + "\n描述: " + productDescription + "\n用途: " + useCase;

    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload)
    };

    const response = UrlFetchApp.fetch(API_ENDPOINT + "?key=" + API_KEY, options);
    const result = JSON.parse(response.getContentText());
    const generatedText = result.candidates[0].content.parts[0].text;

    const output = {
      content: generatedText,
      meta: {
        useCase: useCase,
        language: "zh-Hant-yue",
        timestamp: new Date().toISOString()
      }
    };

    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
