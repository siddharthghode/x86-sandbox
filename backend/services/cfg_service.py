"""
cfg_service.py
Returns CFG node/edge data for known examples.
Ported directly from the original HTML's CFG_DATA object.
"""

CFG_DATA = {
    "fact": {
        "title": "Factorial (recursive)",
        "nodes": [
            {"id": "entry", "label": "factorial", "sub": "cmp rdi, 1", "x": 200, "y": 30, "type": "entry"},
            {"id": "base", "label": ".base", "sub": "mov rax, 1\nret", "x": 60, "y": 160, "type": "exit"},
            {"id": "recurse", "label": "recursive path",
             "sub": "push rbx\nmov rbx, rdi\ndec rdi\ncall factorial\nimul rax, rbx\npop rbx\nret",
             "x": 340, "y": 160, "type": "body"},
        ],
        "edges": [
            {"from": "entry", "to": "base", "label": "jle (n≤1)"},
            {"from": "entry", "to": "recurse", "label": "jg (n>1)"},
        ],
    },
    "fib": {
        "title": "Fibonacci (iterative)",
        "nodes": [
            {"id": "entry", "label": "fib", "sub": "test rdi, rdi\ncmp rdi, 1", "x": 200, "y": 30, "type": "entry"},
            {"id": "zero", "label": "fib(0)=0", "sub": "xor rax, rax\nret", "x": 60, "y": 160, "type": "exit"},
            {"id": "one", "label": "fib(1)=1", "sub": "mov rax, 1\nret", "x": 200, "y": 160, "type": "exit"},
            {"id": "loop", "label": ".loop", "sub": "add rax, rcx\nxchg rax, rcx\ndec rdi", "x": 360, "y": 160, "type": "loop"},
            {"id": "done", "label": "done", "sub": "mov rax, rcx\nret", "x": 360, "y": 310, "type": "exit"},
        ],
        "edges": [
            {"from": "entry", "to": "zero", "label": "jz"},
            {"from": "entry", "to": "one", "label": "je (n==1)"},
            {"from": "entry", "to": "loop", "label": "else"},
            {"from": "loop", "to": "loop", "label": "jg (dec≠0)", "back": True},
            {"from": "loop", "to": "done", "label": "fall through"},
        ],
    },
    "loop": {
        "title": "Simple counted loop",
        "nodes": [
            {"id": "init", "label": "init", "sub": "mov rcx, 10\nxor rax, rax", "x": 200, "y": 30, "type": "entry"},
            {"id": "loop", "label": ".loop", "sub": "add rax, rcx\ndec rcx", "x": 200, "y": 160, "type": "loop"},
            {"id": "done", "label": "done", "sub": "ret", "x": 200, "y": 310, "type": "exit"},
        ],
        "edges": [
            {"from": "init", "to": "loop", "label": ""},
            {"from": "loop", "to": "loop", "label": "jnz (rcx≠0)", "back": True},
            {"from": "loop", "to": "done", "label": "fall (rcx==0)"},
        ],
    },
    "switch": {
        "title": "Switch / jump table",
        "nodes": [
            {"id": "entry", "label": "switch(n)",
             "sub": "cmp rdi, 3\nja .default\nlea rax, [rip+table]\njmp [rax+rdi*8]",
             "x": 200, "y": 30, "type": "entry"},
            {"id": "c0", "label": "case 0", "sub": "...", "x": 20, "y": 200, "type": "body"},
            {"id": "c1", "label": "case 1", "sub": "...", "x": 130, "y": 200, "type": "body"},
            {"id": "c2", "label": "case 2", "sub": "...", "x": 240, "y": 200, "type": "body"},
            {"id": "c3", "label": "case 3", "sub": "...", "x": 350, "y": 200, "type": "body"},
            {"id": "def", "label": "default", "sub": "...", "x": 200, "y": 340, "type": "exit"},
        ],
        "edges": [
            {"from": "entry", "to": "def", "label": "ja"},
            {"from": "entry", "to": "c0", "label": "table[0]"},
            {"from": "entry", "to": "c1", "label": "table[1]"},
            {"from": "entry", "to": "c2", "label": "table[2]"},
            {"from": "entry", "to": "c3", "label": "table[3]"},
        ],
    },
    "shell": {
        "title": "execve shellcode",
        "nodes": [
            {"id": "entry", "label": "_start",
             "sub": "xor rdx, rdx\nxor rsi, rsi\nlea rdi, [rip+sh]",
             "x": 200, "y": 30, "type": "entry"},
            {"id": "exec", "label": "execve", "sub": "push 59 / pop rax\nsyscall", "x": 200, "y": 160, "type": "exit"},
            {"id": "data", "label": "data: /bin/sh", "sub": "db '/bin/sh', 0", "x": 200, "y": 310, "type": "data"},
        ],
        "edges": [
            {"from": "entry", "to": "exec", "label": ""},
            {"from": "entry", "to": "data", "label": "lea rip-rel", "style": "dashed"},
        ],
    },
}


def get_cfg(name: str) -> dict:
    if name not in CFG_DATA:
        return {"error": f"Unknown CFG: {name}. Available: {list(CFG_DATA.keys())}"}
    return CFG_DATA[name]
