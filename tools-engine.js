/* --------------------------------------------------
   tools-engine.js
   PdfSwift — واجهة احترافية لكل الأدوات (Client-Side)
-------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {

    /* --------------------------------------------------
       0) نظام النوافذ (Modal System)
    -------------------------------------------------- */

    let modal, modalContent, modalBody, modalTitle, modalClose;

    function createModalShell() {
        modal = document.createElement("div");
        modal.id = "tool-modal";
        modal.style.position = "fixed";
        modal.style.inset = "0";
        modal.style.background = "rgba(0,0,0,0.6)";
        modal.style.display = "none";
        modal.style.zIndex = "9999";
        modal.style.justifyContent = "center";
        modal.style.alignItems = "center";
        modal.style.padding = "20px";

        modalContent = document.createElement("div");
        modalContent.style.background = "var(--card-bg, #fff)";
        modalContent.style.color = "var(--text-color, #111)";
        modalContent.style.borderRadius = "16px";
        modalContent.style.maxWidth = "900px";
        modalContent.style.width = "100%";
        modalContent.style.maxHeight = "90vh";
        modalContent.style.display = "flex";
        modalContent.style.flexDirection = "column";
        modalContent.style.boxShadow = "0 20px 60px rgba(0,0,0,0.25)";
        modalContent.style.overflow = "hidden";

        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.alignItems = "center";
        header.style.justifyContent = "space-between";
        header.style.padding = "16px 20px";
        header.style.borderBottom = "1px solid rgba(0,0,0,0.08)";

        modalTitle = document.createElement("h3");
        modalTitle.style.margin = "0";
        modalTitle.style.fontSize = "1.1rem";

        modalClose = document.createElement("button");
        modalClose.innerHTML = '<i class="fas fa-times"></i>';
        modalClose.style.border = "none";
        modalClose.style.background = "transparent";
        modalClose.style.cursor = "pointer";
        modalClose.style.fontSize = "1.1rem";

        header.appendChild(modalTitle);
        header.appendChild(modalClose);

        modalBody = document.createElement("div");
        modalBody.id = "tool-modal-body";
        modalBody.style.padding = "16px 20px";
        modalBody.style.overflow = "auto";

        modalContent.appendChild(header);
        modalContent.appendChild(modalBody);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        modalClose.addEventListener("click", closeModal);
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
    }

    function openModal(title, innerHTML) {
        if (!modal) createModalShell();
        modalTitle.textContent = title;
        modalBody.innerHTML = innerHTML;
        modal.style.display = "flex";
    }

    function closeModal() {
        if (modal) {
            modal.style.display = "none";
            modalBody.innerHTML = "";
        }
    }

    /* --------------------------------------------------
       1) أداة أبشر — الإعدادات الرسمية
    -------------------------------------------------- */

    const absherSizes = {
        national:  { w: 413, h: 531, maxKB: 200 },
        iqama:     { w: 413, h: 531, maxKB: 200 },
        passport:  { w: 600, h: 600, maxKB: 500 },
        license:   { w: 600, h: 400, maxKB: 300 }
    };

    const absherInput      = document.getElementById("absher-input");
    const absherType       = document.getElementById("absher-type");
    const absherCropArea   = document.getElementById("absher-crop-area");
    const absherProcessBtn = document.getElementById("absher-process");
    const absherResult     = document.getElementById("absher-result");

    let absherCropper = null;

    if (absherInput) {
        absherInput.addEventListener("change", function () {
            const file = this.files[0];
            if (!file) return;

            const img = document.createElement("img");
            img.style.maxWidth = "100%";

            const reader = new FileReader();
            reader.onload = () => {
                img.src = reader.result;

                absherCropArea.innerHTML = "";
                absherCropArea.appendChild(img);

                if (absherCropper) absherCropper.destroy();

                if (typeof Cropper === "undefined") {
                    alert("Cropper.js غير محمّل. تأكد من إضافة المكتبة في tools.html");
                    return;
                }

                absherCropper = new Cropper(img, {
                    aspectRatio: NaN, // قص يدوي
                    viewMode: 1,
                    background: false
                });
            };

            reader.readAsDataURL(file);
        });
    }

    if (absherProcessBtn) {
        absherProcessBtn.addEventListener("click", () => {
            if (!absherCropper) {
                alert("الرجاء رفع الصورة أولاً");
                return;
            }

            const type = absherType.value;
            const { w, h, maxKB } = absherSizes[type];

            const croppedCanvas = absherCropper.getCroppedCanvas({
                width: w,
                height: h
            });

            const finalCanvas = document.createElement("canvas");
            finalCanvas.width = w;
            finalCanvas.height = h;

            const ctx = finalCanvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(croppedCanvas, 0, 0, w, h);

            finalCanvas.toBlob((blob) => {
                if (!blob) {
                    alert("حدث خطأ أثناء معالجة الصورة");
                    return;
                }

                if (typeof Compressor === "undefined") {
                    // بدون Compressor.js — نستخدم الصورة كما هي
                    const kb = Math.round(blob.size / 1024);
                    if (kb > maxKB) {
                        alert(`حجم الصورة ${kb}KB — يجب أن يكون أقل من ${maxKB}KB`);
                    }
                    const url = URL.createObjectURL(blob);
                    renderAbsherResult(url);
                    return;
                }

                new Compressor(blob, {
                    quality: 0.9,
                    maxWidth: w,
                    maxHeight: h,
                    success(result) {
                        const kb = Math.round(result.size / 1024);
                        if (kb > maxKB) {
                            alert(`حجم الصورة ${kb}KB — يجب أن يكون أقل من ${maxKB}KB`);
                        }
                        const url = URL.createObjectURL(result);
                        renderAbsherResult(url);
                    },
                    error(err) {
                        console.error(err);
                        alert("حدث خطأ أثناء ضغط الصورة");
                    }
                });

            }, "image/jpeg", 0.95);
        });
    }

    function renderAbsherResult(url) {
        absherResult.innerHTML = `
            <h3>الصورة جاهزة للتحميل</h3>
            <img src="${url}" style="max-width:250px;border:1px solid #ddd;border-radius:10px;">
            <br><br>
            <a href="${url}" download="absher-photo.jpg" class="btn btn-primary">تحميل الصورة</a>
        `;
    }

    /* --------------------------------------------------
       2) أدوات الصور — منطق عام
    -------------------------------------------------- */

    const imageToolButtons = document.querySelectorAll("#image-tools .tool-btn");

    imageToolButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const tool = btn.dataset.tool;
            switch (tool) {
                case "crop-image":
                    openImageCropTool();
                    break;
                case "resize-image":
                    openImageResizeTool();
                    break;
                case "convert-image":
                    openImageConvertTool();
                    break;
                case "enhance-image":
                    openImageEnhanceTool();
                    break;
                case "rotate-image":
                    openImageRotateTool();
                    break;
            }
        });
    });

    function buildImageUploadBlock(extraControls = "") {
        return `
            <div class="tool-panel">
                <div class="drop-zone" id="img-drop-zone">
                    <p>اسحب الصورة هنا أو اضغط للاختيار</p>
                    <input type="file" id="img-file-input" accept="image/*" style="display:none;">
                </div>
                ${extraControls}
                <div id="img-preview" style="margin-top:16px;"></div>
                <div id="img-actions" style="margin-top:16px;"></div>
            </div>
        `;
    }

    function initImageDropZone(onFileLoaded) {
        const dropZone = document.getElementById("img-drop-zone");
        const fileInput = document.getElementById("img-file-input");

        if (!dropZone || !fileInput) return;

        dropZone.addEventListener("click", () => fileInput.click());

        ["dragenter", "dragover"].forEach(evt => {
            dropZone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add("active");
            });
        });

        ["dragleave", "drop"].forEach(evt => {
            dropZone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove("active");
            });
        });

        dropZone.addEventListener("drop", (e) => {
            const file = e.dataTransfer.files[0];
            if (file) handleImageFile(file, onFileLoaded);
        });

        fileInput.addEventListener("change", () => {
            const file = fileInput.files[0];
            if (file) handleImageFile(file, onFileLoaded);
        });
    }

    function handleImageFile(file, onFileLoaded) {
        if (!file.type.startsWith("image/")) {
            alert("الرجاء اختيار ملف صورة");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            onFileLoaded(reader.result, file);
        };
        reader.readAsDataURL(file);
    }

    /* ---- 2.1 قص الصورة ---- */

    function openImageCropTool() {
        openModal("قص الصورة", buildImageUploadBlock());
        let cropper = null;

        initImageDropZone((dataUrl) => {
            const preview = document.getElementById("img-preview");
            preview.innerHTML = "";
            const img = document.createElement("img");
            img.src = dataUrl;
            img.style.maxWidth = "100%";
            preview.appendChild(img);

            if (cropper) cropper.destroy();

            if (typeof Cropper === "undefined") {
                alert("Cropper.js غير محمّل");
                return;
            }

            cropper = new Cropper(img, {
                viewMode: 1,
                background: false
            });

            const actions = document.getElementById("img-actions");
            actions.innerHTML = `
                <button id="img-crop-save" class="btn btn-primary">تحميل الصورة المقصوصة</button>
            `;

            document.getElementById("img-crop-save").onclick = () => {
                const canvas = cropper.getCroppedCanvas();
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "cropped-image.png";
                    a.click();
                });
            };
        });
    }

    /* ---- 2.2 تغيير الحجم ---- */

    function openImageResizeTool() {
        const controls = `
            <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
                <div>
                    <label>العرض (px)</label>
                    <input type="number" id="resize-width" class="input" style="width:120px;">
                </div>
                <div>
                    <label>الارتفاع (px)</label>
                    <input type="number" id="resize-height" class="input" style="width:120px;">
                </div>
            </div>
        `;
        openModal("تغيير حجم الصورة", buildImageUploadBlock(controls));

        let originalImg = null;

        initImageDropZone((dataUrl) => {
            const preview = document.getElementById("img-preview");
            preview.innerHTML = `<img id="resize-img" src="${dataUrl}" style="max-width:100%;">`;
            originalImg = document.getElementById("resize-img");

            originalImg.onload = () => {
                document.getElementById("resize-width").value = originalImg.naturalWidth;
                document.getElementById("resize-height").value = originalImg.naturalHeight;
            };

            const actions = document.getElementById("img-actions");
            actions.innerHTML = `
                <button id="img-resize-save" class="btn btn-primary">تحميل الصورة بالحجم الجديد</button>
            `;

            document.getElementById("img-resize-save").onclick = () => {
                if (!originalImg) return;
                const w = parseInt(document.getElementById("resize-width").value, 10);
                const h = parseInt(document.getElementById("resize-height").value, 10);
                if (!w || !h) {
                    alert("الرجاء إدخال أبعاد صحيحة");
                    return;
                }

                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(originalImg, 0, 0, w, h);

                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "resized-image.png";
                    a.click();
                });
            };
        });
    }

    /* ---- 2.3 تغيير الصيغة ---- */

    function openImageConvertTool() {
        const controls = `
            <div style="margin-top:12px;">
                <label>الصيغة المطلوبة:</label>
                <select id="convert-format" class="input">
                    <option value="image/png">PNG</option>
                    <option value="image/jpeg">JPG</option>
                    <option value="image/webp">WEBP</option>
                </select>
            </div>
        `;
        openModal("تغيير صيغة الصورة", buildImageUploadBlock(controls));

        let imgEl = null;

        initImageDropZone((dataUrl, file) => {
            const preview = document.getElementById("img-preview");
            preview.innerHTML = `<img id="convert-img" src="${dataUrl}" style="max-width:100%;">`;
            imgEl = document.getElementById("convert-img");

            const actions = document.getElementById("img-actions");
            actions.innerHTML = `
                <button id="img-convert-save" class="btn btn-primary">تحميل الصورة بالصيغة الجديدة</button>
            `;

            document.getElementById("img-convert-save").onclick = () => {
                if (!imgEl) return;
                const format = document.getElementById("convert-format").value;

                const canvas = document.createElement("canvas");
                canvas.width = imgEl.naturalWidth;
                canvas.height = imgEl.naturalHeight;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(imgEl, 0, 0);

                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    const ext = format === "image/png" ? "png" :
                                format === "image/webp" ? "webp" : "jpg";
                    a.download = `converted.${ext}`;
                    a.click();
                }, format, 0.95);
            };
        });
    }

    /* ---- 2.4 تحسين بسيط ---- */

    function openImageEnhanceTool() {
        openModal("تحسين جودة الصورة (بسيط)", buildImageUploadBlock());

        let imgEl = null;

        initImageDropZone((dataUrl) => {
            const preview = document.getElementById("img-preview");
            preview.innerHTML = `<img id="enhance-img" src="${dataUrl}" style="max-width:100%;">`;
            imgEl = document.getElementById("enhance-img");

            const actions = document.getElementById("img-actions");
            actions.innerHTML = `
                <button id="img-enhance-save" class="btn btn-primary">تحميل نسخة محسّنة</button>
            `;

            document.getElementById("img-enhance-save").onclick = () => {
                if (!imgEl) return;

                const canvas = document.createElement("canvas");
                canvas.width = imgEl.naturalWidth;
                canvas.height = imgEl.naturalHeight;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(imgEl, 0, 0);

                // "تحسين" بسيط: إعادة حفظ بجودة عالية (أحيانًا يقلل الضوضاء)
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "enhanced.jpg";
                    a.click();
                }, "image/jpeg", 0.95);
            };
        });
    }

    /* ---- 2.5 تدوير الصورة ---- */

    function openImageRotateTool() {
        const controls = `
            <div style="margin-top:12px;">
                <label>زاوية التدوير:</label>
                <select id="rotate-angle" class="input">
                    <option value="90">90°</option>
                    <option value="180">180°</option>
                    <option value="270">270°</option>
                </select>
            </div>
        `;
        openModal("تدوير الصورة", buildImageUploadBlock(controls));

        let imgEl = null;

        initImageDropZone((dataUrl) => {
            const preview = document.getElementById("img-preview");
            preview.innerHTML = `<img id="rotate-img" src="${dataUrl}" style="max-width:100%;">`;
            imgEl = document.getElementById("rotate-img");

            const actions = document.getElementById("img-actions");
            actions.innerHTML = `
                <button id="img-rotate-save" class="btn btn-primary">تحميل الصورة بعد التدوير</button>
            `;

            document.getElementById("img-rotate-save").onclick = () => {
                if (!imgEl) return;
                const angle = parseInt(document.getElementById("rotate-angle").value, 10);

                const radians = angle * Math.PI / 180;
                const sin = Math.abs(Math.sin(radians));
                const cos = Math.abs(Math.cos(radians));

                const w = imgEl.naturalWidth;
                const h = imgEl.naturalHeight;

                const newW = Math.round(w * cos + h * sin);
                const newH = Math.round(w * sin + h * cos);

                const canvas = document.createElement("canvas");
                canvas.width = newW;
                canvas.height = newH;
                const ctx = canvas.getContext("2d");

                ctx.translate(newW / 2, newH / 2);
                ctx.rotate(radians);
                ctx.drawImage(imgEl, -w / 2, -h / 2);

                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "rotated-image.png";
                    a.click();
                });
            };
        });
    }

    /* --------------------------------------------------
       3) أدوات PDF — Client-Side + واجهة احترافية
    -------------------------------------------------- */

    const pdfToolButtons = document.querySelectorAll("#pdf-tools .tool-btn");

    pdfToolButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const tool = btn.dataset.tool;
            switch (tool) {
                case "merge-pdf":
                    openMergePdfTool();
                    break;
                case "compress-pdf":
                    openCompressPdfTool();
                    break;
                case "split-pdf":
                    openSplitPdfTool();
                    break;
                case "pdf-to-img":
                    openPdfToImgTool();
                    break;
                case "img-to-pdf":
                    openImgToPdfTool();
                    break;
                case "ocr-pdf":
                    openOcrPdfTool();
                    break;
                case "remove-pages":
                    openRemovePagesTool();
                    break;
                case "reorder-pages":
                    openReorderPagesTool();
                    break;
            }
        });
    });

    function buildPdfUploadBlock(extraControls = "") {
        return `
            <div class="tool-panel">
                <div class="drop-zone" id="pdf-drop-zone">
                    <p>اسحب ملفات PDF هنا أو اضغط للاختيار</p>
                    <input type="file" id="pdf-file-input" accept="application/pdf" multiple style="display:none;">
                </div>
                ${extraControls}
                <div id="pdf-file-list" style="margin-top:16px;"></div>
                <div id="pdf-actions" style="margin-top:16px;"></div>
            </div>
        `;
    }

    function initPdfDropZone(onFilesSelected) {
        const dropZone = document.getElementById("pdf-drop-zone");
        const fileInput = document.getElementById("pdf-file-input");

        if (!dropZone || !fileInput) return;

        dropZone.addEventListener("click", () => fileInput.click());

        ["dragenter", "dragover"].forEach(evt => {
            dropZone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add("active");
            });
        });

        ["dragleave", "drop"].forEach(evt => {
            dropZone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove("active");
            });
        });

        dropZone.addEventListener("drop", (e) => {
            const files = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");
            if (files.length) onFilesSelected(files);
        });

        fileInput.addEventListener("change", () => {
            const files = Array.from(fileInput.files).filter(f => f.type === "application/pdf");
            if (files.length) onFilesSelected(files);
        });
    }

    function renderPdfFileList(files) {
        const list = document.getElementById("pdf-file-list");
        if (!list) return;
        if (!files || !files.length) {
            list.innerHTML = "<p>لم يتم اختيار أي ملفات بعد.</p>";
            return;
        }
        list.innerHTML = `
            <ul class="file-list">
                ${files.map(f => `<li>${f.name} — ${(f.size/1024).toFixed(1)} KB</li>`).join("")}
            </ul>
        `;
    }

    /* ---- 3.1 دمج PDF ---- */

    function openMergePdfTool() {
        if (typeof PDFLib === "undefined") {
            openModal("دمج ملفات PDF", "<p>مكتبة pdf-lib غير محمّلة. أضفها أولاً في tools.html.</p>");
            return;
        }

        openModal("دمج ملفات PDF", buildPdfUploadBlock());

        let selectedFiles = [];

        initPdfDropZone((files) => {
            selectedFiles = files;
            renderPdfFileList(selectedFiles);

            const actions = document.getElementById("pdf-actions");
            actions.innerHTML = `
                <button id="pdf-merge-run" class="btn btn-primary">دمج الملفات وتحميل النتيجة</button>
            `;

            document.getElementById("pdf-merge-run").onclick = async () => {
                if (!selectedFiles.length) {
                    alert("الرجاء اختيار ملفات PDF أولاً");
                    return;
                }

                try {
                    const { PDFDocument } = PDFLib;
                    const mergedPdf = await PDFDocument.create();

                    for (const file of selectedFiles) {
                        const bytes = await file.arrayBuffer();
                        const pdf = await PDFDocument.load(bytes);
                        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                        copiedPages.forEach(p => mergedPdf.addPage(p));
                    }

                    const mergedBytes = await mergedPdf.save();
                    const blob = new Blob([mergedBytes], { type: "application/pdf" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "merged.pdf";
                    a.click();
                } catch (err) {
                    console.error(err);
                    alert("حدث خطأ أثناء دمج الملفات");
                }
            };
        });
    }

    /* ---- 3.2 ضغط PDF (بسيط: إعادة حفظ) ---- */

    function openCompressPdfTool() {
        if (typeof PDFLib === "undefined") {
            openModal("ضغط PDF", "<p>مكتبة pdf-lib غير محمّلة. أضفها أولاً في tools.html.</p>");
            return;
        }

        const controls = `
            <div style="margin-top:12px;">
                <label>مستوى الضغط (تجريبي):</label>
                <input type="range" id="pdf-compress-level" min="1" max="3" value="2">
                <small>القيمة الأعلى = ضغط أكثر (لكن قد يقلّ الوضوح)</small>
            </div>
        `;
        openModal("ضغط ملف PDF", buildPdfUploadBlock(controls));

        let selectedFiles = [];

        initPdfDropZone((files) => {
            selectedFiles = files.slice(0, 1); // ملف واحد فقط
            renderPdfFileList(selectedFiles);

            const actions = document.getElementById("pdf-actions");
            actions.innerHTML = `
                <button id="pdf-compress-run" class="btn btn-primary">ضغط الملف وتحميل النتيجة</button>
            `;

            document.getElementById("pdf-compress-run").onclick = async () => {
                if (!selectedFiles.length) {
                    alert("الرجاء اختيار ملف PDF أولاً");
                    return;
                }

                try {
                    const { PDFDocument } = PDFLib;
                    const file = selectedFiles[0];
                    const bytes = await file.arrayBuffer();
                    const pdf = await PDFDocument.load(bytes, {
                        updateMetadata: true
                    });

                    // ملاحظة: pdf-lib لا يدعم "ضغط حقيقي" للصور،
                    // لكن إعادة الحفظ أحيانًا تقلل الحجم قليلاً.
                    const compressedBytes = await pdf.save({
                        useObjectStreams: true
                    });

                    const blob = new Blob([compressedBytes], { type: "application/pdf" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "compressed.pdf";
                    a.click();
                } catch (err) {
                    console.error(err);
                    alert("حدث خطأ أثناء ضغط الملف");
                }
            };
        });
    }

    /* ---- 3.3 تقسيم PDF (حسب نطاق صفحات) ---- */

    function openSplitPdfTool() {
        if (typeof PDFLib === "undefined") {
            openModal("تقسيم PDF", "<p>مكتبة pdf-lib غير محمّلة. أضفها أولاً في tools.html.</p>");
            return;
        }

        const controls = `
            <div style="margin-top:12px;">
                <label>نطاق الصفحات (مثال: 1-3):</label>
                <input type="text" id="split-range" class="input" placeholder="1-3">
            </div>
        `;
        openModal("تقسيم ملف PDF", buildPdfUploadBlock(controls));

        let selectedFiles = [];

        initPdfDropZone((files) => {
            selectedFiles = files.slice(0, 1);
            renderPdfFileList(selectedFiles);

            const actions = document.getElementById("pdf-actions");
            actions.innerHTML = `
                <button id="pdf-split-run" class="btn btn-primary">تقسيم وتحميل الملف</button>
            `;

            document.getElementById("pdf-split-run").onclick = async () => {
                if (!selectedFiles.length) {
                    alert("الرجاء اختيار ملف PDF أولاً");
                    return;
                }

                const rangeStr = document.getElementById("split-range").value.trim();
                const match = rangeStr.match(/^(\d+)\s*-\s*(\d+)$/);
                if (!match) {
                    alert("الرجاء إدخال نطاق صحيح مثل: 1-3");
                    return;
                }
                const start = parseInt(match[1], 10) - 1;
                const end = parseInt(match[2], 10) - 1;

                try {
                    const { PDFDocument } = PDFLib;
                    const file = selectedFiles[0];
                    const bytes = await file.arrayBuffer();
                    const pdf = await PDFDocument.load(bytes);
                    const total = pdf.getPageCount();

                    if (start < 0 || end >= total || start > end) {
                        alert("نطاق الصفحات غير صحيح");
                        return;
                    }

                    const newPdf = await PDFDocument.create();
                    const copiedPages = await newPdf.copyPages(pdf, Array.from({ length: end - start + 1 }, (_, i) => start + i));
                    copiedPages.forEach(p => newPdf.addPage(p));

                    const newBytes = await newPdf.save();
                    const blob = new Blob([newBytes], { type: "application/pdf" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "split.pdf";
                    a.click();
                } catch (err) {
                    console.error(err);
                    alert("حدث خطأ أثناء تقسيم الملف");
                }
            };
        });
    }

    /* ---- 3.4 PDF إلى صور (صفحات كصور PNG) ---- */

    function openPdfToImgTool() {
        openModal("تحويل PDF إلى صور", "<p>هذه الأداة تحتاج pdf.js (pdfjs-dist) لعرض الصفحات كصور. يمكنك إضافتها لاحقًا، أو استخدام سيرفر.</p>");
    }

    /* ---- 3.5 صور إلى PDF ---- */

    function openImgToPdfTool() {
        if (typeof PDFLib === "undefined") {
            openModal("صور إلى PDF", "<p>مكتبة pdf-lib غير محمّلة. أضفها أولاً في tools.html.</p>");
            return;
        }

        const html = `
            <div class="tool-panel">
                <div class="drop-zone" id="img2pdf-drop-zone">
                    <p>اسحب الصور هنا أو اضغط للاختيار</p>
                    <input type="file" id="img2pdf-file-input" accept="image/*" multiple style="display:none;">
                </div>
                <div id="img2pdf-file-list" style="margin-top:16px;"></div>
                <div id="img2pdf-actions" style="margin-top:16px;"></div>
            </div>
        `;
        openModal("تحويل صور إلى PDF", html);

        const dropZone = document.getElementById("img2pdf-drop-zone");
        const fileInput = document.getElementById("img2pdf-file-input");
        let selectedFiles = [];

        dropZone.addEventListener("click", () => fileInput.click());

        ["dragenter", "dragover"].forEach(evt => {
            dropZone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add("active");
            });
        });

        ["dragleave", "drop"].forEach(evt => {
            dropZone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove("active");
            });
        });

        dropZone.addEventListener("drop", (e) => {
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
            if (files.length) handle(files);
        });

        fileInput.addEventListener("change", () => {
            const files = Array.from(fileInput.files).filter(f => f.type.startsWith("image/"));
            if (files.length) handle(files);
        });

        function handle(files) {
            selectedFiles = files;
            const list = document.getElementById("img2pdf-file-list");
            list.innerHTML = `
                <ul class="file-list">
                    ${files.map(f => `<li>${f.name} — ${(f.size/1024).toFixed(1)} KB</li>`).join("")}
                </ul>
            `;
            const actions = document.getElementById("img2pdf-actions");
            actions.innerHTML = `
                <button id="img2pdf-run" class="btn btn-primary">تحويل إلى PDF</button>
            `;

            document.getElementById("img2pdf-run").onclick = async () => {
                if (!selectedFiles.length) {
                    alert("الرجاء اختيار صور أولاً");
                    return;
                }

                try {
                    const { PDFDocument, StandardFonts, rgb } = PDFLib;
                    const pdfDoc = await PDFDocument.create();

                    for (const file of selectedFiles) {
                        const bytes = await file.arrayBuffer();
                        const imgType = file.type;

                        let img;
                        if (imgType === "image/jpeg" || imgType === "image/jpg") {
                            img = await pdfDoc.embedJpg(bytes);
                        } else {
                            img = await pdfDoc.embedPng(bytes);
                        }

                        const { width, height } = img;
                        const page = pdfDoc.addPage([width, height]);
                        page.drawImage(img, {
                            x: 0,
                            y: 0,
                            width,
                            height
                        });
                    }

                    const pdfBytes = await pdfDoc.save();
                    const blob = new Blob([pdfBytes], { type: "application/pdf" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "images-to-pdf.pdf";
                    a.click();
                } catch (err) {
                    console.error(err);
                    alert("حدث خطأ أثناء تحويل الصور إلى PDF");
                }
            };
        }
    }

    /* ---- 3.6 OCR PDF (تحتاج Tesseract.js أو سيرفر) ---- */

    function openOcrPdfTool() {
        openModal("استخراج النصوص OCR", "<p>هذه الأداة تحتاج Tesseract.js ومعالجة صفحات PDF كصور. يمكنك إضافتها لاحقًا أو تنفيذها عبر سيرفر.</p>");
    }

    /* ---- 3.7 إزالة صفحات ---- */

    function openRemovePagesTool() {
        if (typeof PDFLib === "undefined") {
            openModal("إزالة صفحات", "<p>مكتبة pdf-lib غير محمّلة. أضفها أولاً في tools.html.</p>");
            return;
        }

        const controls = `
            <div style="margin-top:12px;">
                <label>أرقام الصفحات المراد إزالتها (مثال: 1,3,5):</label>
                <input type="text" id="remove-pages-list" class="input" placeholder="1,3,5">
            </div>
        `;
        openModal("إزالة صفحات من PDF", buildPdfUploadBlock(controls));

        let selectedFiles = [];

        initPdfDropZone((files) => {
            selectedFiles = files.slice(0, 1);
            renderPdfFileList(selectedFiles);

            const actions = document.getElementById("pdf-actions");
            actions.innerHTML = `
                <button id="pdf-remove-run" class="btn btn-primary">إزالة الصفحات وتحميل الملف</button>
            `;

            document.getElementById("pdf-remove-run").onclick = async () => {
                if (!selectedFiles.length) {
                    alert("الرجاء اختيار ملف PDF أولاً");
                    return;
                }

                const listStr = document.getElementById("remove-pages-list").value.trim();
                if (!listStr) {
                    alert("الرجاء إدخال أرقام الصفحات");
                    return;
                }

                const toRemove = listStr.split(",").map(s => parseInt(s.trim(), 10) - 1).filter(n => !isNaN(n));

                try {
                    const { PDFDocument } = PDFLib;
                    const file = selectedFiles[0];
                    const bytes = await file.arrayBuffer();
                    const pdf = await PDFDocument.load(bytes);
                    const total = pdf.getPageCount();

                    const newPdf = await PDFDocument.create();
                    const keepIndices = [];
                    for (let i = 0; i < total; i++) {
                        if (!toRemove.includes(i)) keepIndices.push(i);
                    }

                    const copiedPages = await newPdf.copyPages(pdf, keepIndices);
                    copiedPages.forEach(p => newPdf.addPage(p));

                    const newBytes = await newPdf.save();
                    const blob = new Blob([newBytes], { type: "application/pdf" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "removed-pages.pdf";
                    a.click();
                } catch (err) {
                    console.error(err);
                    alert("حدث خطأ أثناء إزالة الصفحات");
                }
            };
        });
    }

    /* ---- 3.8 إعادة ترتيب الصفحات ---- */

    function openReorderPagesTool() {
        if (typeof PDFLib === "undefined") {
            openModal("إعادة ترتيب الصفحات", "<p>مكتبة pdf-lib غير محمّلة. أضفها أولاً في tools.html.</p>");
            return;
        }

        const controls = `
            <div style="margin-top:12px;">
                <label>ترتيب الصفحات الجديد (مثال: 2,1,3):</label>
                <input type="text" id="reorder-pages-list" class="input" placeholder="2,1,3">
            </div>
        `;
        openModal("إعادة ترتيب صفحات PDF", buildPdfUploadBlock(controls));

        let selectedFiles = [];

        initPdfDropZone((files) => {
            selectedFiles = files.slice(0, 1);
            renderPdfFileList(selectedFiles);

            const actions = document.getElementById("pdf-actions");
            actions.innerHTML = `
                <button id="pdf-reorder-run" class="btn btn-primary">إعادة الترتيب وتحميل الملف</button>
            `;

            document.getElementById("pdf-reorder-run").onclick = async () => {
                if (!selectedFiles.length) {
                    alert("الرجاء اختيار ملف PDF أولاً");
                    return;
                }

                const listStr = document.getElementById("reorder-pages-list").value.trim();
                if (!listStr) {
                    alert("الرجاء إدخال ترتيب الصفحات");
                    return;
                }

                const newOrder = listStr.split(",").map(s => parseInt(s.trim(), 10) - 1).filter(n => !isNaN(n));

                try {
                    const { PDFDocument } = PDFLib;
                    const file = selectedFiles[0];
                    const bytes = await file.arrayBuffer();
                    const pdf = await PDFDocument.load(bytes);
                    const total = pdf.getPageCount();

                    if (newOrder.some(i => i < 0 || i >= total)) {
                        alert("ترتيب الصفحات يحتوي أرقام غير صحيحة");
                        return;
                    }

                    const newPdf = await PDFDocument.create();
                    const copiedPages = await newPdf.copyPages(pdf, newOrder);
                    copiedPages.forEach(p => newPdf.addPage(p));

                    const newBytes = await newPdf.save();
                    const blob = new Blob([newBytes], { type: "application/pdf" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "reordered.pdf";
                    a.click();
                } catch (err) {
                    console.error(err);
                    alert("حدث خطأ أثناء إعادة ترتيب الصفحات");
                }
            };
        });
    }

    /* --------------------------------------------------
       4) أشياء بسيطة للواجهة (لو احتجتها)
    -------------------------------------------------- */

    const menuToggle = document.getElementById("menuToggle");
    const nav = document.querySelector(".nav");
    if (menuToggle && nav) {
        menuToggle.addEventListener("click", () => {
            nav.classList.toggle("open");
        });
    }

});
