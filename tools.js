/* ============================
   التنقل بين الأدوات
============================ */
document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
  btn.addEventListener('click', () => {
    const tool = btn.dataset.tool;
    if (!tool) return;

    document.querySelectorAll('.tool-selector, .section-title, main > p, .convert-hero')
      .forEach(el => el.style.display = 'none');

    document.querySelectorAll('.tool-section').forEach(el => el.style.display = 'none');

    const section = document.getElementById(`tool-${tool}`);
    if (section) section.style.display = 'block';

    document.getElementById('back-to-tools').style.display = 'block';
  });
});

document.getElementById('back-to-tools').addEventListener('click', () => {
  document.querySelectorAll('.tool-section').forEach(el => el.style.display = 'none');
  document.getElementById('back-to-tools').style.display = 'none';

  document.querySelectorAll('.tool-selector, .section-title, main > p, .convert-hero')
    .forEach(el => el.style.display = '');
});

/* ============================
   نافذة الأدوات الجديدة
============================ */
function openModal(title, desc) {
  document.getElementById("modal-title").innerText = title;
  document.getElementById("modal-desc").innerText = desc;
  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

/* ============================
   دمج ملفات PDF
============================ */
document.getElementById("btn-merge").addEventListener("click", async () => {
  const files = document.getElementById("merge-files").files;
  const status = document.getElementById("merge-status");

  if (!files.length) {
    status.textContent = "الرجاء اختيار ملفات PDF";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري الدمج...";
  status.className = "status";

  try {
    const mergedPdf = await PDFLib.PDFDocument.create();

    for (let file of files) {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFLib.PDFDocument.load(bytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(p => mergedPdf.addPage(p));
    }

    const mergedBytes = await mergedPdf.save();
    const blob = new Blob([mergedBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "merged.pdf";
    link.click();

    status.textContent = "تم الدمج بنجاح ✔️";
    status.className = "status success";

  } catch (err) {
    status.textContent = "حدث خطأ أثناء الدمج";
    status.className = "status error";
  }
});

/* ============================
   تدوير PDF
============================ */
document.getElementById("btn-rotate").addEventListener("click", async () => {
  const file = document.getElementById("rotate-file").files[0];
  const degree = parseInt(document.getElementById("rotate-degree").value);
  const status = document.getElementById("rotate-status");

  if (!file) {
    status.textContent = "الرجاء اختيار ملف PDF";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري التدوير...";
  status.className = "status";

  try {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);

    pdfDoc.getPages().forEach(page => {
      page.setRotation(PDFLib.degrees(degree));
    });

    const newBytes = await pdfDoc.save();
    const blob = new Blob([newBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "rotated.pdf";
    link.click();

    status.textContent = "تم التدوير بنجاح ✔️";
    status.className = "status success";

  } catch (err) {
    status.textContent = "حدث خطأ أثناء التدوير";
    status.className = "status error";
  }
});

/* ============================
   تقسيم PDF
============================ */
document.getElementById("btn-split").addEventListener("click", async () => {
  const file = document.getElementById("split-file").files[0];
  const ranges = document.getElementById("split-ranges").value;
  const status = document.getElementById("split-status");

  if (!file || !ranges.trim()) {
    status.textContent = "الرجاء اختيار ملف وكتابة الصفحات";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري استخراج الصفحات...";
  status.className = "status";

  try {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);

    const parts = ranges.split(",");
    let counter = 1;

    for (let part of parts) {
      let [start, end] = part.split("-").map(n => parseInt(n) - 1);
      if (isNaN(end)) end = start;

      const newPdf = await PDFLib.PDFDocument.create();
      const pages = await newPdf.copyPages(pdfDoc, [...Array(end - start + 1).keys()].map(i => start + i));
      pages.forEach(p => newPdf.addPage(p));

      const newBytes = await newPdf.save();
      const blob = new Blob([newBytes], { type: "application/pdf" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `pages-${counter}.pdf`;
      link.click();

      counter++;
    }

    status.textContent = "تم استخراج الصفحات ✔️";
    status.className = "status success";

  } catch (err) {
    status.textContent = "حدث خطأ أثناء استخراج الصفحات";
    status.className = "status error";
  }
});

/* ============================
   علامة مائية
============================ */
document.getElementById("btn-watermark").addEventListener("click", async () => {
  const file = document.getElementById("watermark-file").files[0];
  const text = document.getElementById("watermark-text").value;
  const status = document.getElementById("watermark-status");

  if (!file || !text.trim()) {
    status.textContent = "الرجاء اختيار ملف وكتابة النص";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري إضافة العلامة...";
  status.className = "status";

  try {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);

    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

    pages.forEach(page => {
      page.drawText(text, {
        x: 50,
        y: page.getHeight() / 2,
        size: 40,
        font,
        color: PDFLib.rgb(0.8, 0.1, 0.1),
        opacity: 0.25,
        rotate: PDFLib.degrees(30)
      });
    });

    const newBytes = await pdfDoc.save();
    const blob = new Blob([newBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "watermarked.pdf";
    link.click();

    status.textContent = "تمت إضافة العلامة ✔️";
    status.className = "status success";

  } catch (err) {
    status.textContent = "حدث خطأ أثناء إضافة العلامة";
    status.className = "status error";
  }
});

/* ============================
   ضغط PDF (مستوى بسيط)
============================ */
document.getElementById("btn-compress").addEventListener("click", async () => {
  const file = document.getElementById("compress-file").files[0];
  const status = document.getElementById("compress-status");

  if (!file) {
    status.textContent = "الرجاء اختيار ملف PDF";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري الضغط (قد يستغرق بعض الوقت)...";
  status.className = "status";

  try {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);

    // إعادة حفظ الملف مع تحسين داخلي (ضغط بسيط)
    const newBytes = await pdfDoc.save({ useObjectStreams: true });
    const blob = new Blob([newBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "compressed.pdf";
    link.click();

    status.textContent = "تم ضغط الملف ✔️ (ضغط بسيط)";
    status.className = "status success";

  } catch (err) {
    status.textContent = "حدث خطأ أثناء الضغط";
    status.className = "status error";
  }
});

/* ============================
   حماية PDF (كلمة مرور + منع النسخ)
============================ */
/* ملاحظة: pdf-lib لا يدعم تشفير كامل بكلمة مرور بشكل مباشر.
   هنا نكتفي بإعادة الحفظ بدون تشفير حقيقي، ويمكن لاحقًا
   ربطها بمكتبة تشفير متخصصة إذا رغبت. */
document.getElementById("btn-protect").addEventListener("click", async () => {
  const file = document.getElementById("protect-file").files[0];
  const password = document.getElementById("protect-password").value;
  const status = document.getElementById("protect-status");

  if (!file || !password.trim()) {
    status.textContent = "الرجاء اختيار ملف وكتابة كلمة المرور";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري تجهيز الملف للحماية...";
  status.className = "status";

  try {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);

    const newBytes = await pdfDoc.save();
    const blob = new Blob([newBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "protected-placeholder.pdf";
    link.click();

    status.textContent = "تم تجهيز الملف، ويمكن لاحقًا ربطه بتشفير فعلي على السيرفر أو مكتبة متقدمة.";
    status.className = "status success";

  } catch (err) {
    status.textContent = "حدث خطأ أثناء الحماية";
    status.className = "status error";
  }
});

/* ============================
   إزالة كلمة المرور
============================ */
/* نفس الملاحظة: إزالة كلمة المرور من PDF مشفّر بالكامل
   تحتاج مكتبة تشفير متخصصة. هنا نحاول فقط فتح الملف
   وإذا كان غير مشفّر أو مشفّر بشكل بسيط يعاد حفظه. */
document.getElementById("btn-remove-password").addEventListener("click", async () => {
  const file = document.getElementById("remove-file").files[0];
  const password = document.getElementById("remove-password").value;
  const status = document.getElementById("remove-status");

  if (!file || !password.trim()) {
    status.textContent = "الرجاء اختيار ملف وكتابة كلمة المرور الحالية";
    status.className = "status error";
    return;
  }

  status.textContent = "محاولة إزالة كلمة المرور...";
  status.className = "status";

  try {
    const bytes = await file.arrayBuffer();
    // في الواقع pdf-lib لا يدعم فتح PDF مشفّر بكلمة مرور
    // هذا مجرد حفظ جديد لنفس الملف
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);
    const newBytes = await pdfDoc.save();
    const blob = new Blob([newBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "unlocked-placeholder.pdf";
    link.click();

    status.textContent = "تم حفظ نسخة جديدة، إزالة كلمة المرور الكاملة تتطلب تشفير متقدم لاحقًا.";
    status.className = "status success";

  } catch (err) {
    status.textContent = "تعذر إزالة كلمة المرور من هذا الملف (قد يكون مشفّرًا بالكامل).";
    status.className = "status error";
  }
});

/* ============================
   توقيع PDF
============================ */
document.getElementById("btn-sign").addEventListener("click", async () => {
  const file = document.getElementById("sign-file").files[0];
  const imgFile = document.getElementById("sign-image").files[0];
  const status = document.getElementById("sign-status");

  if (!file || !imgFile) {
    status.textContent = "الرجاء اختيار ملف PDF وصورة التوقيع";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري إضافة التوقيع...";
  status.className = "status";

  try {
    const pdfBytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);

    const imgBytes = await imgFile.arrayBuffer();
    let signatureImage;
    if (imgFile.type.includes("png")) {
      signatureImage = await pdfDoc.embedPng(imgBytes);
    } else {
      signatureImage = await pdfDoc.embedJpg(imgBytes);
    }

    const pages = pdfDoc.getPages();
    const sigWidth = signatureImage.width / 3;
    const sigHeight = signatureImage.height / 3;

    pages.forEach(page => {
      const { width, height } = page.getSize();
      page.drawImage(signatureImage, {
        x: width - sigWidth - 40,
        y: 40,
        width: sigWidth,
        height: sigHeight
      });
    });

    const newBytes = await pdfDoc.save();
    const blob = new Blob([newBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "signed.pdf";
    link.click();

    status.textContent = "تم إضافة التوقيع ✔️";
    status.className = "status success";

  } catch (err) {
    status.textContent = "حدث خطأ أثناء التوقيع";
    status.className = "status error";
  }
});

/* ============================
   ترتيب الصفحات
============================ */
document.getElementById("btn-reorder").addEventListener("click", async () => {
  const file = document.getElementById("reorder-file").files[0];
  const orderStr = document.getElementById("reorder-order").value;
  const status = document.getElementById("reorder-status");

  if (!file || !orderStr.trim()) {
    status.textContent = "الرجاء اختيار ملف وكتابة ترتيب الصفحات";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري ترتيب الصفحات...";
  status.className = "status";

  try {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);

    const totalPages = pdfDoc.getPageCount();
    const order = orderStr.split(",").map(n => parseInt(n.trim(), 10) - 1);

    if (order.some(n => isNaN(n) || n < 0 || n >= totalPages)) {
      status.textContent = "ترتيب غير صالح، تأكد من الأرقام.";
      status.className = "status error";
      return;
    }

    const newPdf = await PDFLib.PDFDocument.create();
    const pages = await newPdf.copyPages(pdfDoc, order);
    pages.forEach(p => newPdf.addPage(p));

    const newBytes = await newPdf.save();
    const blob = new Blob([newBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "reordered.pdf";
    link.click();

    status.textContent = "تم ترتيب الصفحات ✔️";
    status.className = "status success";

  } catch (err) {
    status.textContent = "حدث خطأ أثناء ترتيب الصفحات";
    status.className = "status error";
  }
});

/* ============================
   PDF → Images
============================ */
document.getElementById("btn-pdf-to-images").addEventListener("click", async () => {
  const file = document.getElementById("pdf-to-images-file").files[0];
  const format = document.getElementById("pdf-image-format").value;
  const status = document.getElementById("pdf-to-images-status");

  if (!file) {
    status.textContent = "الرجاء اختيار ملف PDF";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري التحويل...";
  status.className = "status";

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;

      const imgData = canvas.toDataURL(`image/${format}`);

      const link = document.createElement("a");
      link.href = imgData;
      link.download = `page-${i}.${format}`;
      link.click();
    }

    status.textContent = "تم تحويل الصفحات إلى صور ✔️";
    status.className = "status success";

  } catch (err) {
    status.textContent = "حدث خطأ أثناء التحويل";
    status.className = "status error";
  }
});

/* ============================
   Images → PDF
============================ */
document.getElementById("btn-images-to-pdf").addEventListener("click", async () => {
  const files = document.getElementById("images-to-pdf-files").files;
  const status = document.getElementById("images-to-pdf-status");

  if (!files.length) {
    status.textContent = "الرجاء اختيار صور";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري التحويل...";
  status.className = "status";

  try {
    const pdfDoc = await PDFLib.PDFDocument.create();

    for (let file of files) {
      const imgBytes = await file.arrayBuffer();
      let img;

      if (file.type.includes("png")) {
        img = await pdfDoc.embedPng(imgBytes);
      } else {
        img = await pdfDoc.embedJpg(imgBytes);
      }

      const page = pdfDoc.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "images.pdf";
    link.click();

    status.textContent = "تم تحويل الصور إلى PDF ✔️";
    status.className = "status success";

  } catch (err) {
    status.textContent = "حدث خطأ أثناء التحويل";
    status.className = "status error";
  }
});

/* ============================
   OCR – تحويل PDF إلى نص
============================ */
document.getElementById("btn-ocr").addEventListener("click", async () => {
  const file = document.getElementById("ocr-file").files[0];
  const lang = document.getElementById("ocr-lang").value;
  const status = document.getElementById("ocr-status");
  const result = document.getElementById("ocr-result");
  const progressFill = document.getElementById("ocr-progress");

  if (!file) {
    status.textContent = "الرجاء اختيار ملف PDF";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري قراءة الصفحات...";
  status.className = "status";
  result.value = "";
  progressFill.style.width = "0%";

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    let currentPage = 0;
    const totalPages = pdf.numPages;

    for (let i = 1; i <= totalPages; i++) {
      currentPage = i;
      status.textContent = `جاري معالجة الصفحة ${i} من ${totalPages}...`;

      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;

      const dataUrl = canvas.toDataURL("image/png");

      await Tesseract.recognize(
        dataUrl,
        lang,
        {
          logger: m => {
            if (m.status === "recognizing text" && m.progress) {
              const base = ((i - 1) / totalPages) * 100;
              const local = m.progress * (100 / totalPages);
              const total = Math.min(100, base + local);
              progressFill.style.width = `${total}%`;
            }
          }
        }
      ).then(({ data: { text } }) => {
        fullText += `\n\n===== صفحة ${i} =====\n\n` + text;
        result.value = fullText;
      });
    }

    progressFill.style.width = "100%";
    status.textContent = "تم استخراج النص ✔️";
    status.className = "status success";

  } catch (err) {
    status.textContent = "حدث خطأ أثناء استخراج النص (OCR)";
    status.className = "status error";
  }
});
