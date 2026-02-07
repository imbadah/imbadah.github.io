/* =========================================================
   PdfSwift — Tools Engine (Glass UI Edition)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* 0) نظام المودال */

    let modal, modalContent, modalBody, modalTitle;

    function createModalShell() {
        modal = document.createElement("div");
        modal.id = "tool-modal";

        modalContent = document.createElement("div");
        modalContent.className = "modal-content";

        const header = document.createElement("div");
        header.className = "modal-header";

        const backBtn = document.createElement("button");
        backBtn.className = "modal-back";
        backBtn.innerHTML = '<i class="fas fa-arrow-right"></i>';
        backBtn.onclick = closeModal;

        modalTitle = document.createElement("h3");

        const closeBtn = document.createElement("button");
        closeBtn.className = "modal-close";
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.onclick = closeModal;

        header.appendChild(backBtn);
        header.appendChild(modalTitle);
        header.appendChild(closeBtn);

        modalBody = document.createElement("div");
        modalBody.className = "modal-body";

        modalContent.appendChild(header);
        modalContent.appendChild(modalBody);
        modal.appendChild(modalContent);

        document.body.appendChild(modal);

        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
    }

    function openModal(title, html) {
        if (!modal) createModalShell();
        modalTitle.textContent = title;
        modalBody.innerHTML = html;
        modal.style.display = "flex";
    }

    function closeModal() {
        if (modal) {
            modal.style.display = "none";
            modalBody.innerHTML = "";
        }
    }

    /* 1) القائمة المنسدلة */

    const menuToggle = document.getElementById("menuToggle");
    const nav = document.querySelector(".nav");

    if (menuToggle && nav) {
        menuToggle.addEventListener("click", () => {
            nav.classList.toggle("open");
        });
    }

    /* 2) أداة أبشر — Glass + قبل/بعد */

    window.openAbsherTool = function () {
        openModal("تجهيز صورة منصة أبشر", `
            <div class="drop-zone" id="absher-drop">
                <p>اسحب الصورة هنا أو اضغط للاختيار</p>
                <input type="file" id="absher-file" accept="image/*" style="display:none;">
            </div>

            <div class="absher-modal-layout">
                <div class="absher-panel">
                    <h4>قبل المعالجة</h4>
                    <div id="absher-before" class="absher-preview-box">
                        <span style="color:#777;">لم يتم اختيار صورة بعد</span>
                    </div>
                </div>

                <div class="absher-panel">
                    <h4>بعد المعالجة</h4>
                    <div id="absher-after" class="absher-preview-box">
                        <span style="color:#777;">ستظهر الصورة الجاهزة هنا</span>
                    </div>
                    <div style="margin-top:10px; text-align:left;">
                        <button id="absher-download" class="btn btn-primary" style="display:none;">
                            تحميل الصورة الجاهزة
                        </button>
                    </div>
                </div>
            </div>
        `);

        const drop = document.getElementById("absher-drop");
        const fileInput = document.getElementById("absher-file");

        drop.onclick = () => fileInput.click();

        drop.addEventListener("dragover", e => {
            e.preventDefault();
            drop.classList.add("active");
        });

        drop.addEventListener("dragleave", () => drop.classList.remove("active"));

        drop.addEventListener("drop", e => {
            e.preventDefault();
            drop.classList.remove("active");
            handleAbsherFile(e.dataTransfer.files[0]);
        });

        fileInput.onchange = () => handleAbsherFile(fileInput.files[0]);
    };

    function handleAbsherFile(file) {
        if (!file) return;

        const beforeBox = document.getElementById("absher-before");
        const afterBox = document.getElementById("absher-after");
        const downloadBtn = document.getElementById("absher-download");

        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.src = reader.result;

            // عرض "قبل"
            beforeBox.innerHTML = "";
            beforeBox.appendChild(img);

            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                // أبعاد أبشر الرسمية
                canvas.width = 413;
                canvas.height = 531;

                // خلفية بيضاء
                ctx.fillStyle = "#fff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // قص تلقائي (مركزي)
                const ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
                const newW = img.width * ratio;
                const newH = img.height * ratio;
                const x = (canvas.width - newW) / 2;
                const y = (canvas.height - newH) / 2;

                ctx.drawImage(img, x, y, newW, newH);

                // تحسين بسيط (لو حاب نضيف لاحقًا فلاتر)
                const url = canvas.toDataURL("image/jpeg", 0.95);

                // عرض "بعد"
                afterBox.innerHTML = `<img src="${url}" alt="صورة أبشر الجاهزة">`;

                // تفعيل زر التحميل
                downloadBtn.style.display = "inline-flex";
                downloadBtn.onclick = () => {
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "absher-photo.jpg";
                    a.click();
                };
            };
        };
        reader.readAsDataURL(file);
    }

    /* 3) ربط أزرار أدوات الصور */

    const imageToolButtons = document.querySelectorAll("#image-tools .tool-btn[data-tool]");

    imageToolButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const tool = btn.dataset.tool;
            if (!tool) return;

            switch (tool) {
                case "crop-image": openImageCropTool(); break;
                case "resize-image": openImageResizeTool(); break;
                case "convert-image": openImageConvertTool(); break;
                case "enhance-image": openImageEnhanceTool(); break;
                case "rotate-image": openImageRotateTool(); break;
            }
        });
    });

    /* 3.1 — قص الصورة */

    function openImageCropTool() {
        openModal("قص الصورة", `
            <div class="drop-zone" id="img-drop">
                <p>اسحب الصورة هنا أو اضغط للاختيار</p>
                <input type="file" id="img-file" accept="image/*" style="display:none;">
            </div>
            <div id="img-preview" style="margin-top:20px;"></div>
            <div id="img-actions" style="margin-top:20px;"></div>
        `);

        const drop = document.getElementById("img-drop");
        const fileInput = document.getElementById("img-file");
        let cropper = null;

        drop.onclick = () => fileInput.click();

        drop.addEventListener("dragover", e => {
            e.preventDefault();
            drop.classList.add("active");
        });

        drop.addEventListener("dragleave", () => drop.classList.remove("active"));

        drop.addEventListener("drop", e => {
            e.preventDefault();
            drop.classList.remove("active");
            loadCropImage(e.dataTransfer.files[0]);
        });

        fileInput.onchange = () => loadCropImage(fileInput.files[0]);

        function loadCropImage(file) {
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                const img = document.createElement("img");
                img.src = reader.result;

                const preview = document.getElementById("img-preview");
                preview.innerHTML = "";
                preview.appendChild(img);

                if (cropper) cropper.destroy();

                cropper = new Cropper(img, {
                    viewMode: 1,
                    background: false
                });

                document.getElementById("img-actions").innerHTML = `
                    <button id="save-crop" class="btn btn-primary">تحميل الصورة</button>
                `;

                document.getElementById("save-crop").onclick = () => {
                    const canvas = cropper.getCroppedCanvas();
                    canvas.toBlob(blob => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "cropped.png";
                        a.click();
                    });
                };
            };
            reader.readAsDataURL(file);
        }
    }

    /* 3.2 — تغيير الحجم */

    function openImageResizeTool() {
        openModal("تغيير حجم الصورة", `
            <div class="drop-zone" id="img-drop">
                <p>اسحب الصورة هنا أو اضغط للاختيار</p>
                <input type="file" id="img-file" accept="image/*" style="display:none;">
            </div>

            <div style="margin-top:15px;display:flex;gap:10px;flex-wrap:wrap;">
                <div>
                    <label>العرض</label>
                    <input type="number" id="resize-w" style="width:120px;">
                </div>
                <div>
                    <label>الارتفاع</label>
                    <input type="number" id="resize-h" style="width:120px;">
                </div>
            </div>

            <div id="img-preview" style="margin-top:20px;"></div>
            <div id="img-actions" style="margin-top:20px;"></div>
        `);

        const drop = document.getElementById("img-drop");
        const fileInput = document.getElementById("img-file");
        let imgEl = null;

        drop.onclick = () => fileInput.click();

        drop.addEventListener("dragover", e => {
            e.preventDefault();
            drop.classList.add("active");
        });

        drop.addEventListener("dragleave", () => drop.classList.remove("active"));

        drop.addEventListener("drop", e => {
            e.preventDefault();
            drop.classList.remove("active");
            loadResizeImage(e.dataTransfer.files[0]);
        });

        fileInput.onchange = () => loadResizeImage(fileInput.files[0]);

        function loadResizeImage(file) {
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                const preview = document.getElementById("img-preview");
                preview.innerHTML = `<img id="resize-img" src="${reader.result}" style="max-width:100%;">`;

                imgEl = document.getElementById("resize-img");

                imgEl.onload = () => {
                    document.getElementById("resize-w").value = imgEl.naturalWidth;
                    document.getElementById("resize-h").value = imgEl.naturalHeight;
                };

                document.getElementById("img-actions").innerHTML = `
                    <button id="save-resize" class="btn btn-primary">تحميل الصورة</button>
                `;

                document.getElementById("save-resize").onclick = () => {
                    const w = parseInt(document.getElementById("resize-w").value);
                    const h = parseInt(document.getElementById("resize-h").value);

                    const canvas = document.createElement("canvas");
                    canvas.width = w;
                    canvas.height = h;

                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(imgEl, 0, 0, w, h);

                    canvas.toBlob(blob => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "resized.png";
                        a.click();
                    });
                };
            };
            reader.readAsDataURL(file);
        }
    }

    /* 3.3 — تغيير الصيغة */

    function openImageConvertTool() {
        openModal("تغيير صيغة الصورة", `
            <div class="drop-zone" id="img-drop">
                <p>اسحب الصورة هنا أو اضغط للاختيار</p>
                <input type="file" id="img-file" accept="image/*" style="display:none;">
            </div>

            <div style="margin-top:15px;">
                <label>الصيغة المطلوبة:</label>
                <select id="convert-format">
                    <option value="image/png">PNG</option>
                    <option value="image/jpeg">JPG</option>
                    <option value="image/webp">WEBP</option>
                </select>
            </div>

            <div id="img-preview" style="margin-top:20px;"></div>
            <div id="img-actions" style="margin-top:20px;"></div>
        `);

        const drop = document.getElementById("img-drop");
        const fileInput = document.getElementById("img-file");
        let imgEl = null;

        drop.onclick = () => fileInput.click();

        drop.addEventListener("dragover", e => {
            e.preventDefault();
            drop.classList.add("active");
        });

        drop.addEventListener("dragleave", () => drop.classList.remove("active"));

        drop.addEventListener("drop", e => {
            e.preventDefault();
            drop.classList.remove("active");
            loadConvertImage(e.dataTransfer.files[0]);
        });

        fileInput.onchange = () => loadConvertImage(fileInput.files[0]);

        function loadConvertImage(file) {
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                const preview = document.getElementById("img-preview");
                preview.innerHTML = `<img id="convert-img" src="${reader.result}" style="max-width:100%;">`;

                imgEl = document.getElementById("convert-img");

                document.getElementById("img-actions").innerHTML = `
                    <button id="save-convert" class="btn btn-primary">تحميل الصورة</button>
                `;

                document.getElementById("save-convert").onclick = () => {
                    const format = document.getElementById("convert-format").value;

                    const canvas = document.createElement("canvas");
                    canvas.width = imgEl.naturalWidth;
                    canvas.height = imgEl.naturalHeight;

                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(imgEl, 0, 0);

                    canvas.toBlob(blob => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;

                        const ext = format === "image/png" ? "png" :
                                    format === "image/webp" ? "webp" : "jpg";

                        a.download = `converted.${ext}`;
                        a.click();
                    }, format, 0.95);
                };
            };
            reader.readAsDataURL(file);
        }
    }

    /* 3.4 — تحسين بسيط */

    function openImageEnhanceTool() {
        openModal("تحسين جودة الصورة", `
            <div class="drop-zone" id="img-drop">
                <p>اسحب الصورة هنا أو اضغط للاختيار</p>
                <input type="file" id="img-file" accept="image/*" style="display:none;">
            </div>

            <div id="img-preview" style="margin-top:20px;"></div>
            <div id="img-actions" style="margin-top:20px;"></div>
        `);

        const drop = document.getElementById("img-drop");
        const fileInput = document.getElementById("img-file");
        let imgEl = null;

        drop.onclick = () => fileInput.click();

        drop.addEventListener("dragover", e => {
            e.preventDefault();
            drop.classList.add("active");
        });

        drop.addEventListener("dragleave", () => drop.classList.remove("active"));

        drop.addEventListener("drop", e => {
            e.preventDefault();
            drop.classList.remove("active");
            loadEnhanceImage(e.dataTransfer.files[0]);
        });

        fileInput.onchange = () => loadEnhanceImage(fileInput.files[0]);

        function loadEnhanceImage(file) {
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                const preview = document.getElementById("img-preview");
                preview.innerHTML = `<img id="enhance-img" src="${reader.result}" style="max-width:100%;">`;

                imgEl = document.getElementById("enhance-img");

                document.getElementById("img-actions").innerHTML = `
                    <button id="save-enhance" class="btn btn-primary">تحميل الصورة</button>
                `;

                document.getElementById("save-enhance").onclick = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = imgEl.naturalWidth;
                    canvas.height = imgEl.naturalHeight;

                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(imgEl, 0, 0);

                    canvas.toBlob(blob => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "enhanced.jpg";
                        a.click();
                    }, "image/jpeg", 0.95);
                };
            };
            reader.readAsDataURL(file);
        }
    }

    /* 3.5 — تدوير الصورة */

    function openImageRotateTool() {
        openModal("تدوير الصورة", `
            <div class="drop-zone" id="img-drop">
                <p>اسحب الصورة هنا أو اضغط للاختيار</p>
                <input type="file" id="img-file" accept="image/*" style="display:none;">
            </div>

            <div style="margin-top:15px;">
                <label>زاوية التدوير:</label>
                <select id="rotate-angle">
                    <option value="90">90°</option>
                    <option value="180">180°</option>
                    <option value="270">270°</option>
                </select>
            </div>

            <div id="img-preview" style="margin-top:20px;"></div>
            <div id="img-actions" style="margin-top:20px;"></div>
        `);

        const drop = document.getElementById("img-drop");
        const fileInput = document.getElementById("img-file");
        let imgEl = null;

        drop.onclick = () => fileInput.click();

        drop.addEventListener("dragover", e => {
            e.preventDefault();
            drop.classList.add("active");
        });

        drop.addEventListener("dragleave", () => drop.classList.remove("active"));

        drop.addEventListener("drop", e => {
            e.preventDefault();
            drop.classList.remove("active");
            loadRotateImage(e.dataTransfer.files[0]);
        });

        fileInput.onchange = () => loadRotateImage(fileInput.files[0]);

        function loadRotateImage(file) {
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                const preview = document.getElementById("img-preview");
                preview.innerHTML = `<img id="rotate-img" src="${reader.result}" style="max-width:100%;">`;

                imgEl = document.getElementById("rotate-img");

                document.getElementById("img-actions").innerHTML = `
                    <button id="save-rotate" class="btn btn-primary">تحميل الصورة</button>
                `;

                document.getElementById("save-rotate").onclick = () => {
                    const angle = parseInt(document.getElementById("rotate-angle").value);

                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");

                    if (angle === 180) {
                        canvas.width = imgEl.naturalWidth;
                        canvas.height = imgEl.naturalHeight;
                    } else {
                        canvas.width = imgEl.naturalHeight;
                        canvas.height = imgEl.naturalWidth;
                    }

                    ctx.translate(canvas.width / 2, canvas.height / 2);
                    ctx.rotate(angle * Math.PI / 180);
                    ctx.drawImage(imgEl, -imgEl.naturalWidth / 2, -imgEl.naturalHeight / 2);

                    canvas.toBlob(blob => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "rotated.png";
                        a.click();
                    });
                };
            };
            reader.readAsDataURL(file);
        }
    }

    /* 4) (اختياري) ربط أدوات PDF لاحقًا */

    const pdfToolButtons = document.querySelectorAll("#pdf-tools .tool-btn[data-tool]");
    pdfToolButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const tool = btn.dataset.tool;
            openModal("قريبًا", `<p>أداة <strong>${tool}</strong> سيتم تفعيلها لاحقًا.</p>`);
        });
    });

});
