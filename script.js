const ADMIN_PASSWORD = "admin1234";
const STORAGE_KEY = "hororong-homepage-content";

const defaultContent = {};
const editableNodes = document.querySelectorAll("[data-editable]");
const overlay = document.querySelector("[data-admin-overlay]");
const openButton = document.querySelector("[data-admin-open]");
const closeButton = document.querySelector("[data-admin-close]");
const loginForm = document.querySelector("[data-admin-login]");
const editorForm = document.querySelector("[data-admin-editor]");
const resetButton = document.querySelector("[data-admin-reset]");
let memoryContent = {};

const createSupabaseClient = () => {
  const config = window.SUPABASE_CONFIG || {};
  const hasConfig = config.url && config.anonKey;
  const hasLibrary = window.supabase && typeof window.supabase.createClient === "function";

  if (!hasConfig || !hasLibrary) {
    return null;
  }

  return window.supabase.createClient(config.url, config.anonKey);
};

const supabaseClient = createSupabaseClient();

const storage = {
  get() {
    if (typeof window.localStorage === "undefined") {
      return memoryContent;
    }

    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
  },
  set(content) {
    if (typeof window.localStorage === "undefined") {
      memoryContent = content;
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  },
  clear() {
    if (typeof window.localStorage === "undefined") {
      memoryContent = {};
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  },
};

editableNodes.forEach((node) => {
  defaultContent[node.dataset.editable] = node.textContent.trim();
});

const readSavedContent = () => {
  try {
    return storage.get();
  } catch {
    return {};
  }
};

const applyContent = (content) => {
  editableNodes.forEach((node) => {
    const key = node.dataset.editable;
    node.textContent = content[key] || defaultContent[key];
  });
};

const loadRemoteContent = async () => {
  if (!supabaseClient) {
    return null;
  }

  const { data, error } = await supabaseClient
    .from("homepage_content")
    .select("content")
    .eq("id", 1)
    .single();

  if (error) {
    console.warn("Supabase load failed:", error.message);
    return null;
  }

  return data?.content || {};
};

const saveRemoteContent = async (content) => {
  if (!supabaseClient) {
    return false;
  }

  const { error } = await supabaseClient
    .from("homepage_content")
    .update({ content })
    .eq("id", 1);

  if (error) {
    console.warn("Supabase save failed:", error.message);
    return false;
  }

  return true;
};

const fillEditor = () => {
  const currentContent = { ...defaultContent, ...readSavedContent() };
  Object.entries(currentContent).forEach(([key, value]) => {
    const field = editorForm.elements[key];
    if (field) {
      field.value = value;
    }
  });
};

const openAdmin = () => {
  overlay.hidden = false;
  loginForm.hidden = false;
  editorForm.hidden = true;
  loginForm.reset();
  loginForm.elements.password.focus();
};

const closeAdmin = () => {
  overlay.hidden = true;
};

applyContent(readSavedContent());

loadRemoteContent().then((remoteContent) => {
  if (remoteContent) {
    applyContent(remoteContent);
    storage.set(remoteContent);
  }
});

openButton.addEventListener("click", openAdmin);
closeButton.addEventListener("click", closeAdmin);

overlay.addEventListener("click", (event) => {
  if (event.target === overlay) {
    closeAdmin();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !overlay.hidden) {
    closeAdmin();
  }
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (loginForm.elements.password.value !== ADMIN_PASSWORD) {
    loginForm.elements.password.setCustomValidity("비밀번호가 맞지 않습니다.");
    loginForm.reportValidity();
    loginForm.elements.password.setCustomValidity("");
    return;
  }

  loginForm.hidden = true;
  editorForm.hidden = false;
  fillEditor();
  editorForm.elements.title.focus();
});

editorForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nextContent = {};
  Object.keys(defaultContent).forEach((key) => {
    const field = editorForm.elements[key];
    nextContent[key] = field ? field.value.trim() || defaultContent[key] : defaultContent[key];
  });

  await saveRemoteContent(nextContent);
  storage.set(nextContent);
  applyContent(nextContent);
  closeAdmin();
});

resetButton.addEventListener("click", () => {
  storage.clear();
  applyContent(defaultContent);
  fillEditor();
});
