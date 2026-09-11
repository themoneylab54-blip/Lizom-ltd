/* ==========================================================================
   Lizom — contact.js
   Sends the contact form through Web3Forms to the inbox the access key
   was created for (themoneylab54@gmail.com, see README).
   1. Create a free access key at https://web3forms.com with that address
   2. Paste it below, replacing the placeholder. The key is public by design:
      it can only send mail to the address it was created for.
   ========================================================================== */
(function () {
  "use strict";

  var WEB3FORMS_ACCESS_KEY = "{{WEB3FORMS_ACCESS_KEY}}";
  var ENDPOINT = "https://api.web3forms.com/submit";
  var CONTACT_EMAIL = "hello@getlizom.com";

  var form = document.getElementById("contact-form");
  if (!form) return;

  var status = document.getElementById("form-status");
  var statusText = status.querySelector(".form-status-text");
  var submit = form.querySelector("[type='submit']");
  var submitLabel = submit.querySelector(".btn-label");
  var submitIcon = submit.querySelector(".icon");
  var spinner = submit.querySelector(".spinner");

  var fields = {
    name: { el: form.elements.name, validate: function (v) { return v.trim().length >= 2 ? "" : "Please enter your name."; } },
    email: { el: form.elements.email, validate: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Please enter a valid email address, for example name@example.com."; } },
    subject: { el: form.elements.subject, validate: function (v) { return v ? "" : "Please choose a subject."; } },
    message: { el: form.elements.message, validate: function (v) { return v.trim().length >= 10 ? "" : "Please write a few more words so we can help."; } },
    consent: { el: form.elements.consent, validate: function (v, el) { return el.checked ? "" : "We need your consent to process your message."; } }
  };

  function fieldWrap(el) { return el.closest(".field"); }
  function setError(key, message) {
    var f = fields[key];
    var wrap = fieldWrap(f.el);
    var errEl = wrap.querySelector(".field-error-text");
    if (message) {
      wrap.classList.add("has-error");
      f.el.setAttribute("aria-invalid", "true");
      errEl.textContent = message;
    } else {
      wrap.classList.remove("has-error");
      f.el.removeAttribute("aria-invalid");
      errEl.textContent = "";
    }
  }
  function validateField(key) {
    var f = fields[key];
    var msg = f.validate(f.el.value, f.el);
    setError(key, msg);
    return !msg;
  }
  function validateAll() {
    var firstInvalid = null;
    Object.keys(fields).forEach(function (key) {
      if (!validateField(key) && !firstInvalid) firstInvalid = fields[key].el;
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  // Validate on blur, clear on input once the field was flagged (inline-validation pattern).
  Object.keys(fields).forEach(function (key) {
    var el = fields[key].el;
    el.addEventListener("blur", function () { if (el.value || el.type === "checkbox") validateField(key); });
    el.addEventListener(el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input", function () {
      if (fieldWrap(el).classList.contains("has-error")) validateField(key);
    });
  });

  function showStatus(type, html) {
    status.classList.remove("is-success", "is-error");
    status.classList.add("is-visible", type === "success" ? "is-success" : "is-error");
    status.querySelector(".icon-success").hidden = type !== "success";
    status.querySelector(".icon-error").hidden = type === "success";
    statusText.innerHTML = html;
    status.focus();
  }
  function hideStatus() { status.classList.remove("is-visible"); }
  function setLoading(on) {
    submit.setAttribute("aria-busy", on ? "true" : "false");
    submit.disabled = on;
    submitLabel.textContent = on ? "Sending…" : "Send message";
    submitIcon.hidden = on;
    spinner.hidden = !on;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideStatus();
    if (!validateAll()) return;

    // Honeypot: bots fill it, humans never see it.
    if (form.elements.botcheck && form.elements.botcheck.checked) return;

    if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY.indexOf("{{") !== -1) {
      showStatus("error", "The contact form is not connected yet. Please email us directly at <a href=\"mailto:" + CONTACT_EMAIL + "\">" + CONTACT_EMAIL + "</a>.");
      return;
    }

    var payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: "[getlizom.com] " + form.elements.subject.value + " — " + form.elements.name.value.trim(),
      from_name: "getlizom.com contact form",
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      topic: form.elements.subject.value,
      message: form.elements.message.value.trim(),
      consent: "Yes, " + new Date().toISOString(),
      botcheck: ""
    };

    setLoading(true);
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 15000) : null;

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (r) {
        if (r.ok && r.data && r.data.success) {
          form.reset();
          Object.keys(fields).forEach(function (k) { setError(k, ""); });
          showStatus("success", "<strong>Message sent.</strong> Thank you, we will reply to " + escapeHtml(payload.email) + " within two business days.");
        } else {
          var reason = r.data && r.data.message ? escapeHtml(String(r.data.message)) : "the form service rejected the request";
          showStatus("error", "<strong>Your message was not sent</strong> (" + reason + "). Please try again, or email us at <a href=\"mailto:" + CONTACT_EMAIL + "\">" + CONTACT_EMAIL + "</a>.");
        }
      })
      .catch(function (err) {
        var why = err && err.name === "AbortError" ? "the request timed out after 15 seconds" : "we could not reach the form service, check your connection";
        showStatus("error", "<strong>Your message was not sent:</strong> " + why + ". Please try again, or email us at <a href=\"mailto:" + CONTACT_EMAIL + "\">" + CONTACT_EMAIL + "</a>.");
      })
      .finally(function () {
        if (timer) clearTimeout(timer);
        setLoading(false);
      });
  });

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; });
  }
})();
