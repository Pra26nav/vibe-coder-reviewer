import re
from pathlib import Path
from app.models.schemas import FileNode, Finding
from app.services.llm_client import tag_file_roles

PY_IMPORT = re.compile(r"^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))", re.MULTILINE)
JS_IMPORT = re.compile(r"""(?:import.*?from\s+["']([^"']+)["']|require\(["']([^"']+)["']\))""")


def extract_imports(path: Path, content: str) -> list[str]:
    imports = []
    if path.suffix == ".py":
        for m in PY_IMPORT.finditer(content):
            imports.append(m.group(1) or m.group(2))
    elif path.suffix in (".js", ".ts", ".jsx", ".tsx"):
        for m in JS_IMPORT.finditer(content):
            mod = m.group(1) or m.group(2)
            if mod and mod.startswith("."):  # only local imports, skip node_modules noise
                imports.append(mod)
    return imports


def build_graph(files: dict[str, str], root: Path) -> list[FileNode]:
    """files: {relative_path_str: content}"""
    rel_paths = list(files.keys())
    roles = tag_file_roles(rel_paths)

    nodes = []
    for rel_path, content in files.items():
        full_path = root / rel_path
        imports = extract_imports(full_path, content)
        nodes.append(
            FileNode(path=rel_path, role=roles.get(rel_path, "other"), imports=imports)
        )
    return nodes


SEVERITY_RANK = {"critical": 3, "high": 3, "medium": 2, "low": 1}
SEVERITY_COLOR = {
    3: "fill:#c0392b",
    2: "fill:#d35400",
    1: "fill:#b7950b",
}
CLEAN_COLOR = "fill:#1e8449"


def to_mermaid(nodes: list[FileNode], findings: list[Finding] | None = None) -> str:
    """Fallback caller should catch exceptions and use table view instead.
    Nodes colored by risk (worst finding severity on that file) rather than just role."""
    lines = ["graph LR"]
    findings = findings or []

    risk_by_file: dict[str, int] = {}
    for f in findings:
        rank = SEVERITY_RANK.get(f.severity, 1)
        if f.file_path not in risk_by_file or rank > risk_by_file[f.file_path]:
            risk_by_file[f.file_path] = rank

    safe_id = lambda p: re.sub(r"[^a-zA-Z0-9]", "_", p)
    display_path = lambda p: p.replace("\\", "/")

    for node in nodes:
        nid = safe_id(node.path)
        label = display_path(node.path)
        rank = risk_by_file.get(node.path)
        style = SEVERITY_COLOR.get(rank, CLEAN_COLOR) if rank else CLEAN_COLOR
        marker = " (risk)" if rank else ""
        lines.append(f'  {nid}["{label}{marker}"]')
        lines.append(f"  style {nid} {style}")

    path_lookup = {n.path: safe_id(n.path) for n in nodes}
    for node in nodes:
        src_id = safe_id(node.path)
        for imp in node.imports:
            for target_path, target_id in path_lookup.items():
                if imp.strip("./").replace(".", "/") in target_path:
                    lines.append(f"  {src_id} --> {target_id}")
                    break

    return "\n".join(lines)