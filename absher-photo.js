let cropper;
let originalImage;

// تحميل نماذج face-api
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("https://cdn.jsdelivr.net/npm/face-api.js/models"),
]).then(() => console.log("Face API Loaded"));

/* ============================
   رفع الصورة + تشغيل Cropper
============================ */
document.getElementById("upload-image").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const img = document.getElementById("image-preview");
  img.src = URL.createObjectURL(file);
  img.style.display = "block";

  originalImage = file;

  if (cropper) cropper.destroy();

  cropper = new Cropper(img, {
    viewMode: 1,
    aspectRatio: 1,
    autoCropArea: 1,
    movable: true,
    zoomable: true,
    scalable: true,
    rotatable: true,
    background: false,
  });

  detectFace();
});

/* ============================
   كشف الوجه تلقائيًا
============================ */
async function detectFace() {
  const img = document.getElementById("image-preview");

  const detection = await faceapi.detectSingleFace(
    img,
    new faceapi.TinyFaceDetectorOptions()
  );

  if (!detection) {
    console.log("لم يتم العثور على وجه");
    return;
  }

  const box = detection.box;

  cropper.setCropBoxData({
    left: box.x,
    top: box.y,
    width: box.width,
    height: box.height,
  });
}

/* ============================
   إظهار حقول المقاس المخصص
============================ */
document.getElementById("preset-size").addEventListener("change", function () {
  const custom = this.value === "custom";
  document.getElementById("custom-width").style.display = custom ? "block" : "none";
  document.getElementById("custom-height").style.display = custom ? "block" : "none";
});

/* ============================
   إظهار لون الخلفية المخصص
============================ */
document.getElementById("background").addEventListener("change", function () {
  document.getElementById("custom-bg").style.display =
    this.value === "custom" ? "block" : "none";
});

/* ============================
   زر تعديل الصورة
============================ */
document.getElementById("process-btn").addEventListener("click", async () => {
  const status = document.getElementById("status");
  status.textContent = "جاري معالجة الصورة...";
  status.className = "status";

  if (!cropper) {
    status.textContent = "الرجاء رفع صورة أولاً";
    status.className = "status error";
    return;
  }

  // المقاس
  let width, height;
  const preset = document.getElementById("preset-size").value;

  if (preset === "custom") {
    width = parseInt(document.getElementById("custom-width").value);
    height = parseInt(document.getElementById("custom-height").value);
  } else {
    const [w, h] = preset.split("x");
    width = parseInt(w);
    height = parseInt(h);
  }

  // الخلفية
  let bg = "white";
  const bgType = document.getElementById("background").value;
  if (bgType === "transparent") bg = null;
  if (bgType === "custom") bg = document.getElementById("custom-bg").value;

  // DPI
  const dpi = parseInt(document.getElementById("dpi").value);

  // الحجم المطلوب
  const maxKB = parseInt(document.getElementById("max-size").value);

  // الصيغة
  const format = document.getElementById("format").value;

  // قص الصورة
  const croppedCanvas = cropper.getCroppedCanvas({
    width,
    height,
    fillColor: bg || "white",
  });

  // إضافة DPI
  const ctx = croppedCanvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";

  // ضغط الصورة للوصول للحجم المطلوب
  let quality = 0.92;
  let output;

  do {
    output = croppedCanvas.toDataURL(`image/${format}`, quality);
    const sizeKB = Math.round((output.length * 3) / 4 / 1024);

    if (sizeKB <= maxKB) break;

    quality -= 0.05;
  } while (quality > 0.1);

  // عرض النتيجة
  document.getElementById("result-preview").innerHTML = `
    <h3>الصورة النهائية:</h3>
    <img src="${output}">
    <br><br>
    <a href="${output}" download="absher-photo.${format}" class="action-btn">تحميل الصورة</a>
  `;

  status.textContent = "تم تجهيز الصورة ✔️";
  status.className = "status success";
});
