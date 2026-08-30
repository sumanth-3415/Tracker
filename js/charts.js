/**
 * TrackMate - Lightweight Vanilla HTML5 Canvas Chart Engine
 * Clean, mobile-friendly charts without external dependencies
 */

class TrackMateCharts {
  static setupCanvas(canvas) {
    if (!canvas) return null;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width: rect.width, height: rect.height };
  }

  // Render Bar Chart (e.g. Weekly Task / Habit completion)
  static renderBarChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const labels = data.labels || [];
    const values = data.values || [];
    const maxVal = Math.max(...values, 5);

    // Draw Grid Lines & Y-axis labels
    const gridSteps = 4;
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= gridSteps; i++) {
      const yVal = Math.round((maxVal / gridSteps) * i);
      const yPos = padding.top + chartH - (i / gridSteps) * chartH;

      ctx.beginPath();
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(padding.left + chartW, yPos);
      ctx.stroke();

      ctx.fillText(yVal.toString(), 10, yPos + 4);
    }

    // Draw Bars
    const barWidth = Math.min(32, (chartW / labels.length) * 0.5);
    const barSpacing = chartW / labels.length;

    labels.forEach((label, idx) => {
      const val = values[idx] || 0;
      const barH = (val / maxVal) * chartH;
      const x = padding.left + idx * barSpacing + (barSpacing - barWidth) / 2;
      const y = padding.top + chartH - barH;

      // Gradient Bar
      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(1, '#4f46e5');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
      ctx.fill();

      // X-axis label
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + barWidth / 2, height - 12);

      // Value label on top of bar
      if (val > 0) {
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(val.toString(), x + barWidth / 2, y - 6);
      }
    });
  }

  // Render Donut Chart (e.g. Task Categories / Status Breakdown)
  static renderDonutChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    ctx.clearRect(0, 0, width, height);

    const labels = data.labels || [];
    const values = data.values || [];
    const colors = data.colors || ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const total = values.reduce((sum, v) => sum + v, 0);

    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2 - 20;
    const innerRadius = outerRadius * 0.65;

    if (total === 0) {
      // Draw empty ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
      ctx.arc(centerX, centerY, innerRadius, 2 * Math.PI, 0, true);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();

      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No Data', centerX, centerY + 4);
      return;
    }

    let startAngle = -Math.PI / 2;

    values.forEach((val, i) => {
      const sliceAngle = (val / total) * (2 * Math.PI);
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      startAngle = endAngle;
    });

    // Center Total text
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(total.toString(), centerX, centerY - 2);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText('TOTAL', centerX, centerY + 14);
  }

  // Render Line Chart (Productivity Trend)
  static renderLineChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const labels = data.labels || [];
    const values = data.values || [];
    const maxVal = Math.max(...values, 100);

    // Draw Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (i / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();
    }

    if (values.length === 0) return;

    const stepX = chartW / (values.length - 1 || 1);
    const points = values.map((val, idx) => ({
      x: padding.left + idx * stepX,
      y: padding.top + chartH - (val / maxVal) * chartH
    }));

    // Area Fill Gradient
    const fillGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    fillGrad.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
    fillGrad.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
    ctx.lineTo(points[0].x, padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Line Path
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Point Dots
    points.forEach((pt, idx) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#6366f1';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label below
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[idx] || '', pt.x, height - 12);
    });
  }
}

window.Charts = TrackMateCharts;

