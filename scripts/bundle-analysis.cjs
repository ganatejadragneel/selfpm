#!/usr/bin/env node

// Bundle Analysis Script - Phase 6 Performance & API Optimization
// Comprehensive bundle analysis with recommendations

const fs = require('fs');
const path = require('path');

// Bundle size thresholds (in KB)
const THRESHOLDS = {
  // Critical chunks that affect initial load
  'app-core': 150,
  'react-vendor': 200,
  'feature-components': 100,

  // Important but non-critical chunks
  'supabase-vendor': 300,
  'ui-components': 100,
  'app-logic': 80,

  // Lazy-loaded chunks (can be larger)
  'analytics-chunk': 400,
  'task-modals': 200,
  'activity-modals': 200,

  // Vendor chunks (generally acceptable to be larger)
  'vendor-misc': 500,
  'icons-vendor': 150,
  'date-vendor': 100,
  'dnd-vendor': 150,

  // Specialized chunks
  'performance-utils': 100,
  'validation-vendor': 80,
  'file-utils-vendor': 200,
};

// Performance impact weights
const PERFORMANCE_WEIGHTS = {
  // Critical for initial load (high impact)
  'app-core': 10,
  'react-vendor': 10,
  'feature-components': 8,
  'ui-components': 7,

  // Important but lower impact
  'supabase-vendor': 6,
  'app-logic': 6,
  'auth-components': 5,

  // Lazy-loaded (lowest impact)
  'analytics-chunk': 2,
  'task-modals': 2,
  'activity-modals': 2,
  'reports-chunk': 2,
  'settings-chunk': 2,

  // Vendors (medium-low impact)
  'vendor-misc': 3,
  'icons-vendor': 4,
  'date-vendor': 3,
  'dnd-vendor': 3,
  'validation-vendor': 3,
};

function analyzeBundle() {
  console.log('🔍 Analyzing bundle structure and performance...\n');

  const distPath = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build not found. Run "npm run build" first.');
    process.exit(1);
  }

  const assets = fs.readdirSync(distPath)
    .filter(file => file.endsWith('.js') || file.endsWith('.css'))
    .map(file => {
      const filepath = path.join(distPath, file);
      const stats = fs.statSync(filepath);
      const sizeKB = Math.round(stats.size / 1024 * 100) / 100;

      // Extract chunk name from filename
      const chunkName = extractChunkName(file);

      return {
        file,
        chunkName,
        sizeKB,
        type: file.endsWith('.js') ? 'js' : 'css',
        threshold: THRESHOLDS[chunkName],
        weight: PERFORMANCE_WEIGHTS[chunkName] || 1
      };
    })
    .sort((a, b) => b.sizeKB - a.sizeKB);

  // Analysis results
  const results = {
    totalSize: assets.reduce((sum, asset) => sum + asset.sizeKB, 0),
    jsSize: assets.filter(a => a.type === 'js').reduce((sum, asset) => sum + asset.sizeKB, 0),
    cssSize: assets.filter(a => a.type === 'css').reduce((sum, asset) => sum + asset.sizeKB, 0),
    chunkCount: assets.filter(a => a.type === 'js').length,
    issues: [],
    recommendations: [],
    performanceScore: 0
  };

  console.log('📊 Bundle Analysis Results');
  console.log('═══════════════════════════');
  console.log(`Total Size: ${results.totalSize} KB`);
  console.log(`JavaScript: ${results.jsSize} KB (${Math.round(results.jsSize / results.totalSize * 100)}%)`);
  console.log(`CSS: ${results.cssSize} KB (${Math.round(results.cssSize / results.totalSize * 100)}%)`);
  console.log(`Chunk Count: ${results.chunkCount}\n`);

  console.log('📦 Chunk Breakdown (JavaScript only)');
  console.log('═══════════════════════════════════');

  let performanceScore = 100;
  const jsAssets = assets.filter(a => a.type === 'js');

  jsAssets.forEach(asset => {
    const status = getChunkStatus(asset);
    const icon = getStatusIcon(status);
    console.log(`${icon} ${asset.chunkName || 'unknown'}: ${asset.sizeKB} KB`);

    if (status !== 'good') {
      const penalty = asset.weight * (status === 'warning' ? 2 : 5);
      performanceScore -= penalty;

      if (status === 'critical') {
        results.issues.push({
          type: 'critical',
          chunk: asset.chunkName,
          size: asset.sizeKB,
          threshold: asset.threshold,
          message: `${asset.chunkName} is critically oversized (${asset.sizeKB} KB > ${asset.threshold} KB)`
        });
      } else if (status === 'warning') {
        results.issues.push({
          type: 'warning',
          chunk: asset.chunkName,
          size: asset.sizeKB,
          threshold: asset.threshold,
          message: `${asset.chunkName} is approaching size limit (${asset.sizeKB} KB, limit: ${asset.threshold} KB)`
        });
      }
    }
  });

  results.performanceScore = Math.max(0, Math.round(performanceScore));

  // Generate recommendations
  generateRecommendations(results, jsAssets);

  // Display results
  console.log(`\n⚡ Performance Score: ${results.performanceScore}/100`);
  console.log(getPerformanceGrade(results.performanceScore));

  if (results.issues.length > 0) {
    console.log('\n⚠️  Issues Found');
    console.log('══════════════');
    results.issues.forEach(issue => {
      const icon = issue.type === 'critical' ? '🚨' : '⚠️';
      console.log(`${icon} ${issue.message}`);
    });
  }

  if (results.recommendations.length > 0) {
    console.log('\n💡 Recommendations');
    console.log('═══════════════');
    results.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
  }

  console.log('\n🎯 Bundle Analysis Complete');
  console.log(`View detailed treemap at: file://${path.join(distPath, 'bundle-analysis.html')}`);

  // Write results to JSON for programmatic access
  const resultsPath = path.join(distPath, 'bundle-analysis.json');
  fs.writeFileSync(resultsPath, JSON.stringify({
    ...results,
    assets: jsAssets,
    timestamp: new Date().toISOString(),
    buildHash: generateBuildHash(jsAssets)
  }, null, 2));

  console.log(`Results saved to: ${resultsPath}`);
}

function extractChunkName(filename) {
  // Extract chunk name from Vite's filename format
  // e.g., "react-vendor-abc123.js" -> "react-vendor"
  const base = filename.replace(/\.(js|css)$/, '');
  const parts = base.split('-');

  // Remove hash (usually last part if it's hex)
  if (parts.length > 1 && /^[a-f0-9]{8,}$/i.test(parts[parts.length - 1])) {
    parts.pop();
  }

  return parts.join('-') || 'unknown';
}

function getChunkStatus(asset) {
  if (!asset.threshold) return 'unknown';

  const ratio = asset.sizeKB / asset.threshold;
  if (ratio > 1.2) return 'critical';
  if (ratio > 0.9) return 'warning';
  return 'good';
}

function getStatusIcon(status) {
  const icons = {
    good: '✅',
    warning: '⚠️',
    critical: '🚨',
    unknown: '❔'
  };
  return icons[status] || '❔';
}

function getPerformanceGrade(score) {
  if (score >= 90) return '🏆 Excellent';
  if (score >= 80) return '🥇 Good';
  if (score >= 70) return '🥈 Fair';
  if (score >= 60) return '🥉 Needs Improvement';
  return '💀 Poor';
}

function generateRecommendations(results, assets) {
  // Initial load bundle size
  const criticalChunks = assets.filter(a =>
    ['app-core', 'react-vendor', 'feature-components', 'ui-components'].includes(a.chunkName)
  );
  const criticalSize = criticalChunks.reduce((sum, a) => sum + a.sizeKB, 0);

  if (criticalSize > 400) {
    results.recommendations.push(
      `Critical bundle size is ${Math.round(criticalSize)} KB. Consider lazy loading more components to get under 400 KB.`
    );
  }

  // Large chunks
  assets.forEach(asset => {
    if (asset.sizeKB > (asset.threshold || 200)) {
      if (asset.chunkName === 'vendor-misc') {
        results.recommendations.push(
          `Split vendor-misc chunk (${asset.sizeKB} KB) into smaller, more specific vendor chunks.`
        );
      } else if (asset.chunkName === 'analytics-chunk') {
        results.recommendations.push(
          `Consider code splitting analytics components further or optimizing chart libraries.`
        );
      } else if (asset.chunkName.includes('modal')) {
        results.recommendations.push(
          `Modal chunk ${asset.chunkName} (${asset.sizeKB} KB) could benefit from lazy loading specific modal content.`
        );
      }
    }
  });

  // Too many chunks
  if (results.chunkCount > 20) {
    results.recommendations.push(
      `High chunk count (${results.chunkCount}). Consider consolidating some smaller chunks to reduce HTTP overhead.`
    );
  }

  // CSS size
  if (results.cssSize > 100) {
    results.recommendations.push(
      `CSS size is ${Math.round(results.cssSize)} KB. Consider CSS code splitting or removing unused styles.`
    );
  }

  // Performance optimizations
  if (results.performanceScore < 80) {
    results.recommendations.push(
      'Enable gzip/brotli compression on your server for better transfer sizes.'
    );

    results.recommendations.push(
      'Consider implementing resource hints (preload, prefetch) for critical chunks.'
    );
  }

  // Bundle-specific recommendations
  const reactVendor = assets.find(a => a.chunkName === 'react-vendor');
  if (reactVendor && reactVendor.sizeKB > 150) {
    results.recommendations.push(
      'React vendor chunk is large. Ensure you\'re using production builds and consider React alternatives for simple components.'
    );
  }

  const iconsVendor = assets.find(a => a.chunkName === 'icons-vendor');
  if (iconsVendor && iconsVendor.sizeKB > 100) {
    results.recommendations.push(
      'Icon vendor chunk is large. Consider tree-shaking unused icons or switching to an icon font.'
    );
  }
}

function generateBuildHash(assets) {
  const content = assets.map(a => `${a.file}:${a.sizeKB}`).join('|');
  return require('crypto').createHash('md5').update(content).digest('hex').substring(0, 8);
}

// Run analysis
if (require.main === module) {
  analyzeBundle();
}

module.exports = { analyzeBundle };