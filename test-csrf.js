// اختبار بسيط لحماية CSRF
import fetch from 'node-fetch';

async function testCsrf() {
  try {
    console.log('اختبار الحصول على CSRF token...');
    
    // الحصول على CSRF token
    const tokenResponse = await fetch('http://localhost:3001/api/csrf-token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!tokenResponse.ok) {
      console.error('فشل في الحصول على CSRF token:', tokenResponse.status);
      return;
    }
    
    const tokenData = await tokenResponse.json();
    console.log('تم الحصول على CSRF token:', tokenData.csrfToken);
    
    // اختبار طلب POST بدون CSRF token (يجب أن يفشل)
    console.log('\nاختبار طلب POST بدون CSRF token...');
    const failResponse = await fetch('http://localhost:3001/api/monitoring/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ interval: 30000 }),
    });
    
    console.log('حالة الطلب بدون CSRF:', failResponse.status);
    if (!failResponse.ok) {
      const errorData = await failResponse.json();
      console.log('رسالة الخطأ:', errorData);
    }
    
    // اختبار طلب POST مع CSRF token (يجب أن ينجح)
    console.log('\nاختبار طلب POST مع CSRF token...');
    const successResponse = await fetch('http://localhost:3001/api/monitoring/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': tokenData.csrfToken,
      },
      body: JSON.stringify({ interval: 30000 }),
    });
    
    console.log('حالة الطلب مع CSRF:', successResponse.status);
    if (successResponse.ok) {
      const successData = await successResponse.json();
      console.log('نتيجة الطلب:', successData);
    } else {
      const errorData = await successResponse.json();
      console.log('رسالة الخطأ:', errorData);
    }
    
  } catch (error) {
    console.error('خطأ في الاختبار:', error.message);
  }
}

testCsrf();