K-ROOF: ปุ่มส่งแบบประเมินเข้า LINE อัตโนมัติ

ไฟล์ใน ZIP
- index.html: เว็บไซต์ที่เปลี่ยนปุ่มสีเขียวเป็น “ส่งแบบประเมินเข้า LINE” และส่งรายละเอียดจากฟอร์มไปยัง Edge Function
- kroof-line-estimate-function.ts: โค้ดฝั่งเซิร์ฟเวอร์สำหรับบันทึกคำขอและส่งข้อความแจ้งเตือนเข้ากลุ่ม LINE
- kroof-estimate-requests.sql: สร้างตารางเก็บคำขอประเมินราคา

ตั้งค่าฝั่ง Supabase ก่อนทดสอบ
1. SQL Editor: เปิดไฟล์ kroof-estimate-requests.sql แล้วรัน
2. Edge Functions > Deploy a new function > Via Editor
   ตั้งชื่อ function: kroof-line-estimate
   วางโค้ดจาก kroof-line-estimate-function.ts แล้ว Deploy
3. เข้า Settings ของ function kroof-line-estimate แล้วปิด Verify JWT สำหรับ endpoint นี้ (โค้ดตรวจ origin และข้อมูลเบื้องต้นอยู่แล้ว)
4. Edge Functions > Secrets ต้องมี:
   LINE_CHANNEL_ACCESS_TOKEN = Channel access token แบบ long-lived จาก LINE Developers > Messaging API > Channel access token
   LINE_GROUP_ID = group ID ของกลุ่มทีมงาน (C...)
   โค้ดรองรับ LINE_GROUP_ID ที่มีอยู่แล้ว หรือจะใช้ LINE_TARGET_ID แทนก็ได้
   ห้ามใช้ Channel secret แทน Channel access token
5. ใน LINE Developers ให้เปิด Use webhook เพื่อใช้ฟังก์ชัน line-webhook หา group ID; ต้องเชิญ OA เข้ากลุ่มและส่งข้อความในกลุ่ม จากนั้นดู Logs ของ line-webhook เพื่อหา LINE GROUP ID FOUND: C...
6. อัปโหลด index.html จาก ZIP ไปแทน index.html ใน GitHub repo Sarawut0909/garage โดยเก็บ config.js เดิมไว้ ห้ามลบหรือเปลี่ยน config.js
7. ทดสอบกรอกแบบประเมินแล้วกดปุ่มสีเขียว ข้อความสถานะควรบอกว่าส่งสำเร็จ และกลุ่ม LINE ควรได้รับรายละเอียด

ข้อควรทราบ
- LINE จะได้รับข้อความรายละเอียดแบบประเมิน (ข้อมูลที่ลูกค้ากรอก) ไม่ใช่ไฟล์ PDF แนบ
- LINE_CHANNEL_SECRET ใช้ตรวจลายเซ็น webhook; ไม่ใช่ token สำหรับส่งข้อความ
- อย่าส่ง Channel access token หรือค่า secret มาในแชต และอย่าใส่ไว้ใน index.html/config.js
