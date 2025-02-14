import React, { useState, useEffect } from 'react';

// GPT生成部分
const CircularProgressChart = ({ todos }) => {
  // 计算任务相关数据 
  const total = todos.length;
  const completed = todos.filter(todo => todo.isCompleted).length;
  const inProgress = total - completed;
  const completedPercentage = total ? (completed / total * 100) : 0;
  const inProgressPercentage = total ? (inProgress / total * 100) : 0;

  // SVG 的基本参数（圆心和半径）
  const cx = 50, cy = 50, r = 40;

  // 将极坐标转换为平面坐标（0° 在顶部，顺时针增加）
  const polarToCartesian = (cx, cy, r, angleDegrees) => {
    const angleRadians = (angleDegrees - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(angleRadians),
      y: cy + r * Math.sin(angleRadians)
    };
  };

  /**
   * 生成带波浪效果的弧线点
   * @param {number} cx 圆心 x 坐标
   * @param {number} cy 圆心 y 坐标
   * @param {number} baseRadius 基本半径
   * @param {number} startAngle 弧线起始角（单位：度）
   * @param {number} endAngle 弧线结束角（单位：度）
   * @param {number} phase 当前相位，用于动态动画
   * @param {number} amplitude 波浪振幅
   * @param {number} frequency 波浪频率（完整波形次数）
   * @param {number} segments 分段数（采样点数，越多越平滑）
   * @returns {Array} 点的数组，每个点为 {x, y}
   */
  const getWavyArcPoints = (cx, cy, baseRadius, startAngle, endAngle, phase = 0, amplitude = 3, frequency = 4, segments = 30) => {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = startAngle + (endAngle - startAngle) * t;
      // 在基本半径上加入正弦波偏移，加上 phase 参数使其随时间变化
      const offset = amplitude * Math.sin(2 * Math.PI * frequency * t + phase);
      const effectiveRadius = baseRadius + offset;
      points.push(polarToCartesian(cx, cy, effectiveRadius, angle));
    }
    return points;
  };

  // 以下情况直接返回整圆，不需要波浪效果

  // 当没有任务时，返回一个填充 in-progress 颜色的整圆，并显示 "0%"
  if (total === 0) {
    return (
      <svg viewBox="0 0 100 100" width="120" height="120">
        <circle cx={cx} cy={cy} r={r} fill="#FF9100" />
        <text x={cx} y={cy} textAnchor="middle" dy="0.3em" fontSize="8" fill="white">
          0%
        </text>
      </svg>
    );
  }

  // 当所有任务均完成时，返回一个填充已完成颜色的整圆，并显示完成百分比
  if (completed === total) {
    return (
      <svg viewBox="0 0 100 100" width="120" height="120">
        <circle cx={cx} cy={cy} r={r} fill="#00E676" />
        <text x={cx} y={cy} textAnchor="middle" dy="0.3em" fontSize="8" fill="white">
          {completedPercentage.toFixed(0)}%
        </text>
      </svg>
    );
  }

  // 当所有任务均未完成时，直接返回一个填充 in-progress 颜色的整圆
  if (completed === 0) {
    return (
      <svg viewBox="0 0 100 100" width="120" height="120">
        <circle cx={cx} cy={cy} r={r} fill="#FF9100" />
        <text x={cx} y={cy} textAnchor="middle" dy="0.3em" fontSize="8" fill="white">
          {inProgressPercentage.toFixed(0)}%
        </text>
      </svg>
    );
  }

  // 针对部分任务完成（0 < completed < total）的情况，我们将使用波浪效果
  // 设置一个 phase 状态，不断更新以驱动动画
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let animationFrameId;
    const animate = () => {
      setPhase(prev => prev + 0.05); // 每帧增加一点相位，调节速度
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // 计算各区域的角度
  const completedAngle = 360 * (completed / total);
  // 让“已完成”区域固定在圆的下侧（中心角 270°）
  const completedStartAngle = 270 - completedAngle / 2;
  const completedEndAngle = 270 + completedAngle / 2;
  // “正在进行中”的区域占据剩余部分
  const inProgressStartAngle = completedEndAngle;
  const inProgressEndAngle = completedStartAngle + 360; // 确保闭合

  // 波浪参数
  const amplitude = 3;
  const frequency = 4;
  const segments = 30;

  // 获取带波浪效果的点数组（随 phase 动态变化）
  const completedPoints = getWavyArcPoints(cx, cy, r, completedStartAngle, completedEndAngle, phase, amplitude, frequency, segments);
  const inProgressPoints = getWavyArcPoints(cx, cy, r, inProgressStartAngle, inProgressEndAngle, phase, amplitude, frequency, segments);

  // 构造路径：从圆心出发，用直线连接所有采样点，再返回圆心闭合
  const completedPath = `M ${cx} ${cy} L ${completedPoints.map(p => `${p.x} ${p.y}`).join(" L ")} L ${cx} ${cy} Z`;
  const inProgressPath = `M ${cx} ${cy} L ${inProgressPoints.map(p => `${p.x} ${p.y}`).join(" L ")} L ${cx} ${cy} Z`;

  // 计算文本参考位置（不带波浪偏移的参考位置，在半径 60% 的处）
  const completedMidAngle = (completedStartAngle + completedEndAngle) / 2;
  const inProgressMidAngle = (inProgressStartAngle + inProgressEndAngle) / 2;
  const completedTextCoords = polarToCartesian(cx, cy, r * 0.6, completedMidAngle);
  const inProgressTextCoords = polarToCartesian(cx, cy, r * 0.6, inProgressMidAngle);

  return (
    <svg viewBox="0 0 100 100" width="120" height="120">
      {/* 已完成区域：使用鲜艳绿色 #00E676 */}
      <path d={completedPath} fill="#00E676" />
      {/* 正在进行中区域：使用鲜艳橙色 #FF9100 */}
      <path d={inProgressPath} fill="#FF9100" />
      {/* 显示百分比文本 */}
      <text x={completedTextCoords.x} y={completedTextCoords.y} textAnchor="middle" dy="0.3em" fontSize="8" fill="white">
        {completedPercentage.toFixed(0)}%
      </text>
      <text x={inProgressTextCoords.x} y={inProgressTextCoords.y} textAnchor="middle" dy="0.3em" fontSize="8" fill="white">
        {inProgressPercentage.toFixed(0)}%
      </text>
    </svg>
  );
};

export default CircularProgressChart;
