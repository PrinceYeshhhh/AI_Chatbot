import logging
from fastapi import FastAPI, Request
from pydantic import BaseModel
from typing import Optional
from transformers import pipeline
import spacy
import yake
# import fasttext  # Uncomment if language detection is needed
from sentence_transformers import SentenceTransformer
import numpy as np
import io
import pdfplumber
import pytesseract
from PIL import Image
import easyocr
import whisper
import tempfile
import pandas as pd
import os
from transformers import CLIPProcessor, CLIPModel
import torch
from transformers import Wav2Vec2Processor, Wav2Vec2Model
import soundfile as sf

app = FastAPI()

# --- Logging setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nlp_microservice")

# --- Hugging Face Pipelines ---
ner_pipeline = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")
sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
paraphrase_pipeline = pipeline("text2text-generation", model="ramsrigouthamg/t5_paraphraser")
intent_pipeline = pipeline("text-classification", model="bhadresh-savani/distilbert-base-uncased-emotion")

# --- spaCy for coref and entity linking ---
try:
    nlp_spacy = spacy.load("en_core_web_trf")
except Exception:
    nlp_spacy = spacy.blank("en")

# --- YAKE for keyword extraction ---
kw_extractor = yake.KeywordExtractor(lan="en", n=2, top=10)

# --- FastText for language detection ---
# ft_lang = fasttext.load_model('lid.176.bin')  # Download from https://dl.fbaipublicfiles.com/fasttext/supervised-models/lid.176.bin

# --- SentenceTransformers for Embeddings ---
try:
    embedder = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    logger.error(f"Failed to load SentenceTransformer: {e}")
    embedder = None

# --- CLIP/BLIP2 Model for Image Embedding ---
try:
    clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch16")
    clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch16")
except Exception as e:
    logger.error(f"Failed to load CLIP model: {e}")
    clip_model = None
    clip_processor = None

# --- Wav2Vec2 Model for Audio Embedding ---
try:
    wav2vec2_model = Wav2Vec2Model.from_pretrained("facebook/wav2vec2-base-960h")
    wav2vec2_processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
except Exception as e:
    logger.error(f"Failed to load Wav2Vec2 model: {e}")
    wav2vec2_model = None
    wav2vec2_processor = None

# --- Request Model ---
class TextRequest(BaseModel):
    text: str
    type: Optional[str] = None
    context: Optional[str] = None

class EmbedRequest(BaseModel):
    texts: list[str]

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/ner")
def ner(req: TextRequest):
    try:
        result = ner_pipeline(req.text)
        logger.info(f"NER request: {req.text[:50]}... -> {result}")
        return {"entities": result}
    except Exception as e:
        logger.error(f"NER error: {e}")
        return {"error": str(e)}, 500

@app.post("/sentiment")
def sentiment(req: TextRequest):
    try:
        result = sentiment_pipeline(req.text)
        logger.info(f"Sentiment request: {req.text[:50]}... -> {result}")
        return result[0]
    except Exception as e:
        logger.error(f"Sentiment error: {e}")
        return {"error": str(e)}, 500

@app.post("/summarize")
def summarize(req: TextRequest):
    try:
        if req.type == "extractive":
            keywords = kw_extractor.extract_keywords(req.text)
            summary = " ".join([kw for kw, _ in keywords])
            logger.info(f"Summarize (extractive) request: {req.text[:50]}... -> {summary}")
            return {"summary": summary}
        else:
            result = summarizer(req.text, max_length=130, min_length=30, do_sample=False)
            logger.info(f"Summarize (abstractive) request: {req.text[:50]}... -> {result}")
            return {"summary": result[0]['summary_text']}
    except Exception as e:
        logger.error(f"Summarize error: {e}")
        return {"error": str(e)}, 500

@app.post("/intent")
def intent(req: TextRequest):
    try:
        result = intent_pipeline(req.text)
        logger.info(f"Intent request: {req.text[:50]}... -> {result}")
        return {"intent": result[0]['label'], "confidence": float(result[0]['score'])}
    except Exception as e:
        logger.error(f"Intent error: {e}")
        return {"error": str(e)}, 500

@app.post("/keywords")
def keywords(req: TextRequest):
    try:
        keywords = kw_extractor.extract_keywords(req.text)
        logger.info(f"Keywords request: {req.text[:50]}... -> {keywords}")
        return {"keywords": [kw for kw, _ in keywords]}
    except Exception as e:
        logger.error(f"Keywords error: {e}")
        return {"error": str(e)}, 500

@app.post("/coref")
def coref(req: TextRequest):
    try:
        doc = nlp_spacy(req.text)
        resolved = getattr(doc._, "coref_resolved", req.text)
        clusters = getattr(doc._, "coref_clusters", [])
        logger.info(f"Coref request: {req.text[:50]}... -> resolved: {resolved}")
        return {
            "resolved_text": resolved,
            "clusters": [[str(m) for m in cluster] for cluster in clusters] if clusters else []
        }
    except Exception as e:
        logger.error(f"Coref error: {e}")
        return {"error": str(e)}, 500

# @app.post("/language")
# def language(req: TextRequest):
#     try:
#         pred = ft_lang.predict(req.text.replace('\n', ' '))[0][0].replace('__label__', '')
#         score = float(ft_lang.predict(req.text.replace('\n', ' '))[1][0])
#         logger.info(f"Language request: {req.text[:50]}... -> {pred}, {score}")
#         return {"language": pred, "score": score}
#     except Exception as e:
#         logger.error(f"Language error: {e}")
#         return {"error": str(e)}, 500

@app.post("/paraphrase")
def paraphrase(req: TextRequest):
    try:
        result = paraphrase_pipeline(f"paraphrase: {req.text}", max_length=256, do_sample=True, top_k=120, top_p=0.98, num_return_sequences=1)
        logger.info(f"Paraphrase request: {req.text[:50]}... -> {result}")
        return {"paraphrased": result[0]['generated_text']}
    except Exception as e:
        logger.error(f"Paraphrase error: {e}")
        return {"error": str(e)}, 500

@app.post("/entity-linking")
def entity_linking(req: TextRequest):
    try:
        doc = nlp_spacy(req.text)
        entities = []
        for ent in doc.ents:
            entity_id = ent.kb_id_ if hasattr(ent, 'kb_id_') else ''
            entity_label = ent.label_
            entities.append({
                "mention": ent.text,
                "entity_id": entity_id,
                "entity_label": entity_label,
                "confidence": float(ent.kb_id_) if entity_id else 1.0
            })
        logger.info(f"Entity linking request: {req.text[:50]}... -> {entities}")
        return {"entities": entities}
    except Exception as e:
        logger.error(f"Entity linking error: {e}")
        return {"error": str(e)}, 500

@app.post("/embed")
def embed(req: EmbedRequest):
    if embedder is None:
        return {"error": "Embedding model not loaded"}, 500
    try:
        embeddings = embedder.encode(req.texts, convert_to_numpy=True).tolist()
        logger.info(f"Embed request: {len(req.texts)} texts -> {np.array(embeddings).shape}")
        return {"embeddings": embeddings}
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        return {"error": str(e)}, 500

@app.post("/pdf")
async def extract_pdf(request: Request):
    try:
        file_bytes = await request.body()
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            text = "\n".join(page.extract_text() or '' for page in pdf.pages)
            num_pages = len(pdf.pages)
        return {"text": text, "metadata": {"num_pages": num_pages}}
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        return {"error": str(e)}, 500

@app.post("/ocr")
async def ocr_image(request: Request):
    try:
        file_bytes = await request.body()
        with Image.open(io.BytesIO(file_bytes)) as img:
            # Try pytesseract first
            try:
                text = pytesseract.image_to_string(img)
                method = "pytesseract"
            except Exception:
                # Fallback to easyocr
                reader = easyocr.Reader(['en'])
                result = reader.readtext(np.array(img))
                text = " ".join([r[1] for r in result])
                method = "easyocr"
        return {"text": text, "metadata": {"ocr_method": method}}
    except Exception as e:
        logger.error(f"OCR error: {e}")
        return {"error": str(e)}, 500

@app.post("/transcribe")
async def transcribe_audio(request: Request):
    try:
        file_bytes = await request.body()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        model = whisper.load_model("base")
        result = model.transcribe(tmp_path)
        os.remove(tmp_path)
        return {"text": result["text"], "metadata": {"language": result.get("language", "en")}}
    except Exception as e:
        logger.error(f"Whisper transcription error: {e}")
        return {"error": str(e)}, 500

@app.post("/table")
async def parse_table(request: Request):
    try:
        file_bytes = await request.body()
        file_name = request.headers.get("x-file-name", "table.csv")
        ext = os.path.splitext(file_name)[-1].lower()
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        if ext == ".csv":
            df = pd.read_csv(tmp_path)
        elif ext in [".xls", ".xlsx"]:
            df = pd.read_excel(tmp_path)
        else:
            raise ValueError("Unsupported table file type")
        os.remove(tmp_path)
        text = df.to_csv(index=False)
        return {"text": text, "metadata": {"columns": list(df.columns), "rows": len(df)}}
    except Exception as e:
        logger.error(f"Table parsing error: {e}")
        return {"error": str(e)}, 500

@app.post("/image-embed")
async def image_embed(request: Request):
    if clip_model is None or clip_processor is None:
        return {"error": "CLIP model not loaded"}, 500
    try:
        file_bytes = await request.body()
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        inputs = clip_processor(images=image, return_tensors="pt")
        with torch.no_grad():
            image_features = clip_model.get_image_features(**inputs)
            image_features = image_features[0].cpu().numpy()
            norm = np.linalg.norm(image_features)
            if norm > 0:
                image_features = image_features / norm
        return {"embedding": image_features.tolist()}
    except Exception as e:
        logger.error(f"Image embedding error: {e}")
        return {"error": str(e)}, 500

@app.post("/audio-embed")
async def audio_embed(request: Request):
    if wav2vec2_model is None or wav2vec2_processor is None:
        return {"error": "Wav2Vec2 model not loaded"}, 500
    try:
        file_bytes = await request.body()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        # Read audio file
        speech, sample_rate = sf.read(tmp_path)
        os.remove(tmp_path)
        if len(speech.shape) > 1:
            speech = speech.mean(axis=1)  # Convert to mono if needed
        inputs = wav2vec2_processor(speech, sampling_rate=sample_rate, return_tensors="pt")
        with torch.no_grad():
            outputs = wav2vec2_model(**inputs)
            # Use mean pooling over the sequence dimension
            audio_features = outputs.last_hidden_state.mean(dim=1)[0].cpu().numpy()
            norm = np.linalg.norm(audio_features)
            if norm > 0:
                audio_features = audio_features / norm
        return {"embedding": audio_features.tolist()}
    except Exception as e:
        logger.error(f"Audio embedding error: {e}")
        return {"error": str(e)}, 500 