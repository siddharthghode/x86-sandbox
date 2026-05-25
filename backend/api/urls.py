from django.urls import path
from .views import AssembleView, ParseElfView, AnalyzeBinaryView, ByteInfoView, CFGView

urlpatterns = [
    path("assemble", AssembleView.as_view()),
    path("parse-elf", ParseElfView.as_view()),
    path("analyze-binary", AnalyzeBinaryView.as_view()),
    path("byte-info", ByteInfoView.as_view()),
    path("cfg", CFGView.as_view()),
]
