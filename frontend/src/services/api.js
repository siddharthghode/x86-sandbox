/**
 * api.js — thin wrapper around fetch for all backend calls.
 * All functions return { data, error }.
 */

async function post(url, body) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

async function postForm(url, formData) {
  try {
    const res = await fetch(url, { method: "POST", body: formData });
    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function assembleSource(source) {
  return post("/api/assemble", { source });
}

export async function parseElf(file) {
  const fd = new FormData();
  fd.append("file", file);
  return postForm("/api/parse-elf", fd);
}

export async function analyzeBinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  return postForm("/api/analyze-binary", fd);
}

export async function fetchCFG(name) {
  try {
    const res = await fetch(`/api/cfg?name=${name}`);
    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}
