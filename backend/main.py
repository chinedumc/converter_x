from fastapi import FastAPI, HTTPException, Depends, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import JSONResponse, FileResponse
from datetime import datetime, timedelta
from typing import Optional
import uvicorn
import jwt
import os
from dotenv import load_dotenv
from ratelimit import limits, RateLimitException
import logging
import sys
from logging.handlers import TimedRotatingFileHandler
from config import Config
import json
import pandas as pd
import xml.etree.ElementTree as ET
from xml.dom import minidom
import re

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Excel to XML Converter API",
    description="A secure API for converting Excel files to XML format",
    version="1.0.0"
)

# Security configurations
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 5  # 5 minutes session timeout

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost","http://localhost:3000"],  # Update with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
log_file = os.path.abspath(getattr(Config, "LOG_FILE_PATH", "logs/app.log"))
log_level = logging.INFO  # Set default log level
logging.basicConfig(
    filename=log_file,
    level=log_level,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    encoding="utf-8",
    force=True
)
log = logging.getLogger("converter_x")
log.info("Test log entry: Backend started")

# Rate limiting decorator - 100 requests per minute
@limits(calls=100, period=60)
def check_rate_limit():
    pass

# Middleware for session timeout
@app.middleware("http")
async def session_middleware(request: Request, call_next):
    try:
        # Check rate limit
        check_rate_limit()
        
        # Get token from header
        token = request.headers.get("Authorization")
        if token and token.startswith("Bearer "):
            token = token.split(" ")[1]
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                exp = payload.get("exp")
                if not exp or datetime.utcfromtimestamp(exp) < datetime.utcnow():
                    raise HTTPException(status_code=401, detail="Session expired")
            except jwt.PyJWTError:
                raise HTTPException(status_code=401, detail="Invalid token")
    except RateLimitException:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests"}
        )
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"detail": e.detail}
        )
    
    response = await call_next(request)
    return response

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# File conversion endpoint
@app.post("/convert")
async def convert_excel_to_xml(
    file: UploadFile = File(...),
    header_fields: str = Form(None)
):
    try:
        log.info(f"File upload attempt: {file.filename}")
        header_fields_dict = json.loads(header_fields) if header_fields else {}

        # If header_fields_dict is a list, convert to dict
        if isinstance(header_fields_dict, list):
            header_fields_dict = {
                item["tagName"]: item["tagValue"]
                for item in header_fields_dict
                if "tagName" in item and "tagValue" in item
            }

        # Save uploaded file temporarily
        temp_path = os.path.join(Config.UPLOAD_DIR, file.filename)
        with open(temp_path, "wb") as f:
            f.write(await file.read())
        log.info(f"File upload successful: {file.filename} saved to {temp_path}")

        # Read Excel file
        log.info(f"Starting conversion for file: {file.filename}")
        df = pd.read_excel(temp_path)

        # Create XML root
        root = ET.Element("CALLREPORT")
        # Add header fields
        header = ET.SubElement(root, "HEADER")
        for k, v in header_fields_dict.items():
            ET.SubElement(header, k).text = str(v)
        # Add data rows
        body_section = ET.SubElement(root, "BODY")
        for _, row in df.iterrows():
            record = ET.SubElement(body_section, "CALLREPORT_DATA")
            for col in df.columns:
                tag = sanitize_tag(col)
                ET.SubElement(record, tag).text = str(row[col])

        # Convert to string
        rough_string = ET.tostring(root, encoding="utf-8", method="xml")
        reparsed = minidom.parseString(rough_string)
        xml_content = reparsed.toprettyxml(indent="  ", encoding="utf-8")

        # Generate a unique filename using date-time-second
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        saved_filename = f"converted_{timestamp}.xml"
        output_path = os.path.join(Config.OUTPUT_DIR, saved_filename)

        # Save XML content to file
        with open(output_path, "wb") as f:
            f.write(xml_content)
        log.info(f"File conversion successful: {file.filename} -> {saved_filename}")

        backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        download_url = f"{backend_url}/download/{saved_filename}"
        log.info(f"Download URL generated: {download_url}")
        return {
            "status": "success",
            "message": "Conversion completed",
            "downloadUrl": download_url
        }
    except Exception as e:
        import traceback
        log.error(f"Conversion failed for file: {file.filename} - {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="An error occurred during the conversion process. Please try again later.")

@app.get("/download/{filename}")
async def download_file(filename: str):
    output_dir = Config.OUTPUT_DIR
    file_path = os.path.join(output_dir, filename)
    log.info(f"Download attempt for file: {filename}")
    if not os.path.exists(file_path):
        log.error(f"File not found for download: {filename}")
        raise HTTPException(status_code=404, detail="File not found")
    log.info(f"File download successful: {filename}")
    return FileResponse(file_path, filename=filename)

@app.get("/")
def read_root():
    return {"message": "Backend is running"}

def sanitize_tag(tag):
    # Replace spaces and invalid characters with underscores
    return re.sub(r'[^a-zA-Z0-9_]', '_', tag)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)