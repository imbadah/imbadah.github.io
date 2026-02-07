/* =========================================================
   PdfSwift — Tools Engine (Client-Side Only)
   All tools run locally on the user's device.
========================================================= */

/* فتح الأدوات داخل مودال */
function openTool(toolName) {
    const modal = document.createElement("div");
    modal.className = "modal open";

    modal.innerHTML = `
        <div class="modal-content" style="max-width:600px;">
            <h3>${getToolTitle(toolName)}</h3>

            <p>اختر ملفًا لبدء استخدام الأداة:</p>
            <input type="file" id="toolFile" accept="${getAcceptedTypes(toolName)}" />

            <div style="margin-top: 18px;">
                <button class="btn btn-primary" onclick="runTool('${toolName}')">تشغيل الأداة</button>
                <button class="modal-close" onclick="this.closest('.modal').remove()">إغلاق</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/* أنواع الملفات المقبولة */
function getAcceptedTypes(tool) {
    if (tool.includes("pdf")) return "application/pdf";
    return "image/*,.pdf";
}

/* أسماء الأدوات */
function getToolTitle(tool) {
    const titles = {
        absher: "تجهيز صورة أبشر",
        img2pdf: "تحويل صورة إلى PDF",
        pdf2img: "تحويل PDF إلى صور",
        compress: "ضغط الصور",
        crop: "قص الصور",
        rotate: "تدوير الصور",

        mergepdf: "دمج ملفات PDF",
        splitpdf: "تقسيم PDF",
        deletepdf: "حذف صفحات PDF",
        rotatepdf: "تدوير صفحات PDF",
        compresspdf: "ضغط PDF"
    };
    return titles[tool] || "أداة غير معروفة";
}

/* تشغيل الأداة */
function runTool(toolName) {
    const fileInput = document.getElementById("toolFile");
    if (!fileInput.files.length) {
        alert("الرجاء اختيار ملف أولاً.");
        return;
    }

    const file = fileInput.files[0];

    switch (toolName) {
        case "absher": prepareAbsherPhoto(file); break;
        case "img2pdf": convertImageToPDF(file); break;
        case "pdf2img": convertPDFToImages(file); break;
        case "compress": compressImage(file); break;
        case "crop": cropImage(file); break;
        case "rotate": rotateImage(file); break;

        case "mergepdf": mergePDF(file); break;
        case "splitpdf": splitPDF(file); break;
        case "deletepdf": deletePDFPages(file); break;
        case "rotatepdf": rotatePDFPages(file); break;
        case "compresspdf": compressPDF(file); break;

        default: alert("الأداة غير معروفة.");
    }
}

/* =========================================================
   1) أدوات PDF الأساسية
========================================================= */

/* دمج PDF — مودال بسيط */
let mergeFiles = [];

function mergePDF() {
    const input = document.getElementById("toolFile");
    mergeFiles.push(input.files[0]);

    if (mergeFiles.length < 2) {
        alert("تم إضافة الملف الأول. أعد فتح الأداة لإضافة ملف آخر.");
        return;
    }

    const pdf = new jspdf.jsPDF();

    let first = true;

    mergeFiles.forEach(async (file, index) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 2 });

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: ctx, viewport }).promise;

            if (!first) pdf.addPage();
            first = false;

            pdf.addImage(canvas.toDataURL(), "JPEG", 0, 0,
                pdf.internal.pageSize.getWidth(),
                pdf.internal.pageSize.getHeight()
            );
        }

        if (index === mergeFiles.length - 1) {
            pdf.save("merged.pdf");
            mergeFiles = [];
        }
    });
}

/* تقسيم PDF */
async function splitPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const pdf = new jspdf.jsPDF();
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;

        pdf.addImage(canvas.toDataURL(), "JPEG", 0, 0,
            pdf.internal.pageSize.getWidth(),
            pdf.internal.pageSize.getHeight()
        );

        pdf.save(`page-${i}.pdf`);
    }
}

/* حذف صفحات PDF */
async function deletePDFPages(file) {
    const pagesToDelete = prompt("أدخل أرقام الصفحات المراد حذفها (مثال: 2,5,7):");
    if (!pagesToDelete) return;

    const deleteList = pagesToDelete.split(",").map(n => parseInt(n.trim()));

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pdf = new jspdf.jsPDF();
    let first = true;

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        if (deleteList.includes(i)) continue;

        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;

        if (!first) pdf.addPage();
        first = false;

        pdf.addImage(canvas.toDataURL(), "JPEG", 0, 0,
            pdf.internal.pageSize.getWidth(),
            pdf.internal.pageSize.getHeight()
        );
    }

    pdf.save("deleted-pages.pdf");
}

/* تدوير صفحات PDF */
async function rotatePDFPages(file) {
    const angle = prompt("أدخل زاوية التدوير (90 أو 180 أو 270):");
    if (!angle) return;

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pdf = new jspdf.jsPDF();
    let first = true;

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (angle == 90 || angle == 270) {
            canvas.width = viewport.height;
            canvas.height = viewport.width;
        } else {
            canvas.width = viewport.width;
            canvas.height = viewport.height;
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((Math.PI / 180) * angle);

        ctx.drawImage(await renderPageImage(page), -viewport.width / 2, -viewport.height / 2);

        if (!first) pdf.addPage();
        first = false;

        pdf.addImage(canvas.toDataURL(), "JPEG", 0, 0,
            pdf.internal.pageSize.getWidth(),
            pdf.internal.pageSize.getHeight()
        );
    }

    pdf.save("rotated.pdf");
}

/* ضغط PDF */
async function compressPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pdf = new jspdf.jsPDF();
    let first = true;

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.2 });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;

        if (!first) pdf.addPage();
        first = false;

        pdf.addImage(canvas.toDataURL("image/jpeg", 0.5), "JPEG", 0, 0,
            pdf.internal.pageSize.getWidth(),
            pdf.internal.pageSize.getHeight()
        );
    }

    pdf.save("compressed.pdf");
}

/* =========================================================
   2) أدوات الصور (كما هي بدون تغيير)
========================================================= */

/* … (كل كود أدوات الصور يبقى كما هو بدون أي تعديل) … */

