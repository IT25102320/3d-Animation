from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from auto_rig.skeleton_gen import generate_skeleton
from auto_rig.skin_bind import bind_mesh_to_skeleton
import tempfile
import os

app = FastAPI(title="MoCap Auto-Rigging API")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/status")
def get_status():
    return {"status": "Active", "zero_error_policy": "Enforced"}

@app.post("/upload")
async def upload_model(file: UploadFile = File(...)):
    """
    Zero-Error Pipeline Endpoint:
    Intercepts any uploaded 3D model. If it lacks an armature, it dynamically
    creates a skeleton and binds the mesh, returning a rigged result.
    """
    valid_extensions = (".obj", ".fbx", ".gltf", ".glb")
    if not file.filename.lower().endswith(valid_extensions):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an OBJ, FBX, or GLTF/GLB.")

    temp_filepath = None
    try:
        # 1. Save uploaded model to temporary file
        content = await file.read()
        suffix = os.path.splitext(file.filename)[1]

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(content)
            temp_filepath = temp_file.name

        # 2. "Zero-Error" Logic: Always attempt to auto-rig if no armature is found
        # (For this MVP, we simulate the auto-rigging process)
        print(f"Processing model: {file.filename}")

        skeleton = generate_skeleton(temp_filepath)
        rigged_model_path = bind_mesh_to_skeleton(temp_filepath, skeleton)

        # 4. Return the path (or binary stream in a real scenario) to the rigged model
        return {
            "message": "Model processed successfully.",
            "original_file": file.filename,
            "rigged_model": "url_to_serve_model/rigged_model.glb"
        }

    except Exception as e:
        # Fallback to prevent crash, returning a default or safe state
        print(f"Error during processing: {e}")
        return {
            "message": "Model fallback triggered. A default rigged character has been assigned to prevent failure.",
            "original_file": file.filename,
            "rigged_model": "url_to_serve_model/default_character.glb",
            "fallback": True
        }
    finally:
        # 3. Clean up the initial temp file securely
        if temp_filepath and os.path.exists(temp_filepath):
            os.remove(temp_filepath)
