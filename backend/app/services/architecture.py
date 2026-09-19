import re
from pathlib import Path
from app.models.schemas import FileNode
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


def to_mermaid(nodes: list[FileNode]) -> str:
    """Fallback caller should catch exceptions and use table view instead."""
    lines = ["graph LR"]
    role_class = {
        "frontend": "fill:#61dafb",
        "backend-api": "fill:#68a063",
        "auth": "fill:#e74c3c",
        "db": "fill:#f39c12",
        "config": "fill:#95a5a6",
        "other": "fill:#bdc3c7",
    }
    safe_id = lambda p: re.sub(r"[^a-zA-Z0-9]", "_", p)

    for node in nodes:
        nid = safe_id(node.path)
        lines.append(f'  {nid}["{node.path}"]')
        lines.append(f"  style {nid} {role_class.get(node.role, '')}")

    path_lookup = {n.path: safe_id(n.path) for n in nodes}
    for node in nodes:
        src_id = safe_id(node.path)
        for imp in node.imports:
            # best-effort match of local import string to actual file node
            for target_path, target_id in path_lookup.items():
                if imp.strip("./").replace(".", "/") in target_path:
                    lines.append(f"  {src_id} --> {target_id}")
                    break

    return "\n".join(lines)
