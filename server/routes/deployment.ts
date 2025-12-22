/**
 * مسارات API للنشر السحابي
 */

import { Router } from 'express';
import { cloudDeploymentService } from '../services/CloudDeploymentService';
import { deploymentConfigManager } from '../services/DeploymentConfigManager';
import { deploymentMonitor } from '../services/DeploymentMonitor';

const router = Router();

/**
 * الحصول على المنصات المدعومة
 */
router.get('/platforms', (req, res) => {
  try {
    const platforms = deploymentConfigManager.getAllPlatformTemplates();
    res.json({
      success: true,
      data: platforms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في الحصول على المنصات المدعومة',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * الحصول على قالب منصة محددة
 */
router.get('/platforms/:platform', (req, res) => {
  try {
    const { platform } = req.params;
    const template = deploymentConfigManager.getPlatformTemplate(platform);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'المنصة غير موجودة'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في الحصول على قالب المنصة',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * التحقق من صحة إعدادات النشر
 */
router.post('/validate', (req, res) => {
  try {
    const config = req.body;
    const validation = deploymentConfigManager.validateDeploymentConfig(config);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في التحقق من الإعدادات',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * إنشاء إعدادات افتراضية
 */
router.post('/default-config', (req, res) => {
  try {
    const { platform, projectName, overrides } = req.body;
    
    if (!platform || !projectName) {
      return res.status(400).json({
        success: false,
        error: 'المنصة واسم المشروع مطلوبان'
      });
    }

    const defaultConfig = deploymentConfigManager.createDefaultConfig(
      platform,
      projectName,
      overrides
    );

    if (!defaultConfig) {
      return res.status(404).json({
        success: false,
        error: 'المنصة غير مدعومة'
      });
    }

    res.json({
      success: true,
      data: defaultConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في إنشاء الإعدادات الافتراضية',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * نشر موجه
 */
router.post('/deploy', async (req, res) => {
  try {
    const { promptId, config } = req.body;
    
    if (!promptId || !config) {
      return res.status(400).json({
        success: false,
        error: 'معرف الموجه والإعدادات مطلوبان'
      });
    }

    // التحقق من صحة الإعدادات
    const validation = deploymentConfigManager.validateDeploymentConfig(config);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'إعدادات النشر غير صالحة',
        details: validation.errors
      });
    }

    // تنفيذ النشر
    const result = await cloudDeploymentService.deployPrompt(promptId, config);

    // بدء مراقبة النشر إذا نجح
    if (result.success && result.url) {
      deploymentMonitor.startMonitoring(result.deploymentId, result.url);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في النشر',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * الحصول على حالة النشر
 */
router.get('/status/:deploymentId', (req, res) => {
  try {
    const { deploymentId } = req.params;
    const status = cloudDeploymentService.getDeploymentStatus(deploymentId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'النشر غير موجود'
      });
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في الحصول على حالة النشر',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * الحصول على جميع النشرات
 */
router.get('/deployments', (req, res) => {
  try {
    const deployments = cloudDeploymentService.getAllDeployments();
    res.json({
      success: true,
      data: deployments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في الحصول على النشرات',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * حذف نشر
 */
router.delete('/deployments/:deploymentId', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    
    // إيقاف المراقبة
    deploymentMonitor.stopMonitoring(deploymentId);
    
    // حذف النشر
    const deleted = await cloudDeploymentService.deleteDeployment(deploymentId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'النشر غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف النشر بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في حذف النشر',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * الحصول على فحص صحة النشر
 */
router.get('/health/:deploymentId', (req, res) => {
  try {
    const { deploymentId } = req.params;
    const healthCheck = deploymentMonitor.getHealthCheck(deploymentId);
    
    if (!healthCheck) {
      return res.status(404).json({
        success: false,
        error: 'النشر غير مراقب'
      });
    }

    res.json({
      success: true,
      data: healthCheck
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في الحصول على فحص الصحة',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * الحصول على مقاييس النشر
 */
router.get('/metrics/:deploymentId', (req, res) => {
  try {
    const { deploymentId } = req.params;
    const metrics = deploymentMonitor.getMetrics(deploymentId);
    
    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'النشر غير مراقب'
      });
    }

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في الحصول على المقاييس',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * الحصول على تقرير حالة النشر
 */
router.get('/report/:deploymentId', (req, res) => {
  try {
    const { deploymentId } = req.params;
    const report = deploymentMonitor.generateStatusReport(deploymentId);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في إنشاء التقرير',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * الحصول على ملخص حالة جميع النشرات
 */
router.get('/overview', async (req, res) => {
  try {
    const overallStatus = deploymentMonitor.getOverallStatus();
    const deploymentStats = await deploymentConfigManager.getDeploymentStats();
    const unhealthyDeployments = deploymentMonitor.getUnhealthyDeployments();

    res.json({
      success: true,
      data: {
        status: overallStatus,
        stats: deploymentStats,
        unhealthy: unhealthyDeployments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في الحصول على الملخص',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * بدء مراقبة نشر
 */
router.post('/monitor/:deploymentId', (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { url, interval } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'رابط النشر مطلوب'
      });
    }

    deploymentMonitor.startMonitoring(deploymentId, url, interval);
    
    res.json({
      success: true,
      message: 'تم بدء مراقبة النشر'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في بدء المراقبة',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * إيقاف مراقبة نشر
 */
router.delete('/monitor/:deploymentId', (req, res) => {
  try {
    const { deploymentId } = req.params;
    deploymentMonitor.stopMonitoring(deploymentId);
    
    res.json({
      success: true,
      message: 'تم إيقاف مراقبة النشر'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في إيقاف المراقبة',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

export default router;