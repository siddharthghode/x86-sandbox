import base64
import json

from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from services.assembler_service import assemble
from services.elf_service import parse_elf
from services.binary_service import analyze, byte_info
from services.cfg_service import get_cfg


@method_decorator(csrf_exempt, name="dispatch")
class AssembleView(View):
    def post(self, request):
        try:
            body = json.loads(request.body or "{}")
        except json.JSONDecodeError:
            body = {}
        source = body.get("source", "").strip()
        if not source:
            return JsonResponse({"error": "No source provided"}, status=400)
        return JsonResponse(assemble(source))


@method_decorator(csrf_exempt, name="dispatch")
class ParseElfView(View):
    def post(self, request):
        if "file" not in request.FILES:
            return JsonResponse({"error": "No file uploaded"}, status=400)
        data = request.FILES["file"].read()
        return JsonResponse(parse_elf(data))


@method_decorator(csrf_exempt, name="dispatch")
class AnalyzeBinaryView(View):
    def post(self, request):
        if "file" not in request.FILES:
            return JsonResponse({"error": "No file uploaded"}, status=400)
        data = request.FILES["file"].read()
        return JsonResponse(analyze(data))


@method_decorator(csrf_exempt, name="dispatch")
class ByteInfoView(View):
    def post(self, request):
        try:
            body = json.loads(request.body or "{}")
        except json.JSONDecodeError:
            body = {}
        raw = base64.b64decode(body.get("data", ""))
        offset = int(body.get("offset", 0))
        return JsonResponse(byte_info(raw, offset))


class CFGView(View):
    def get(self, request):
        name = request.GET.get("name", "fact")
        return JsonResponse(get_cfg(name))
