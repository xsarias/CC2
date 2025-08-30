from pydantic import BaseModel
from typing import List

# Entrada de datos
class SearchRequest(BaseModel):
    array: List[int]
    target: int

# Respuesta del backend
class SearchResponse(BaseModel):
    found: bool
    index: int
