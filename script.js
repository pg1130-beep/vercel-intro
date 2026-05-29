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
const adminStatus = document.querySelector("[data-admin-status]");
let memoryContent = {};

const createSupabaseClient = () => {
  const config = window.SUPABASE_CONFIG || {};
  const hasConfig = config.url && config.anonKey;
  const hasLibrary = window.supabase && typeof window.supabase.createClient === "function";

  if (!hasConfig) {
    return null;
  }

  if (hasLibrary) {
    return {
      async read() {
        const client = window.supabase.createClient(config.url, config.anonKey);
        const { data, error } = await client
          .from("homepage_content")
          .select("content")
          .eq("id", 1)
          .single();

        if (error) {
          throw error;
        }

        return data?.content || {};
      },
      async write(content) {
        const client = window.supabase.createClient(config.url, config.anonKey);
        const { error } = await client
          .from("homepage_content")
          .update({ content })
          .eq("id", 1);

        if (error) {
          throw error;
        }
      },
    };
  }

  const endpoint = `${config.url.replace(/\/$/, "")}/rest/v1/homepage_content?id=eq.1`;
  const headers = {
    apikey: config.anonKey,
    Authorization: `Bearer ${config.anonKey}`,
    "Content-Type": "application/json",
  };

  return {
    async read() {
      const response = await fetch(`${endpoint}&select=content`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Supabase read failed: ${response.status}`);
      }

      const rows = await response.json();
      return rows[0]?.content || {};
    },
    async write(content) {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`Supabase write failed: ${response.status}`);
      }
    },
  };
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

const setAdminStatus = (message, type = "info") => {
  if (!adminStatus) {
    return;
  }

  adminStatus.textContent = message;
  adminStatus.dataset.type = type;
};

const loadRemoteContent = async () => {
  if (!supabaseClient) {
    return null;
  }

  try {
    return await supabaseClient.read();
  } catch (error) {
    console.warn("Supabase load failed:", error.message);
    return null;
  }
};

const saveRemoteContent = async (content) => {
  if (!supabaseClient) {
    return true;
  }

  try {
    await supabaseClient.write(content);
    return true;
  } catch (error) {
    console.warn("Supabase save failed:", error.message);
    return false;
  }
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
  setAdminStatus("");
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

  const remoteSaved = await saveRemoteContent(nextContent);

  if (supabaseClient && !remoteSaved) {
    setAdminStatus("Supabase 저장에 실패했습니다. SQL/RLS 설정을 확인하세요.", "error");
    return;
  }

  storage.set(nextContent);
  applyContent(nextContent);
  setAdminStatus("저장되었습니다.", "success");
  closeAdmin();
});

resetButton.addEventListener("click", async () => {
  const remoteSaved = await saveRemoteContent({});

  if (supabaseClient && !remoteSaved) {
    setAdminStatus("Supabase 초기화에 실패했습니다.", "error");
    return;
  }

  storage.clear();
  applyContent(defaultContent);
  fillEditor();
  setAdminStatus("초기화되었습니다.", "success");
});
