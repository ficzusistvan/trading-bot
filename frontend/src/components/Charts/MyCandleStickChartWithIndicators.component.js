import React from "react";
import PropTypes from "prop-types";

import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import { ChartCanvas, Chart } from "react-stockcharts";
import {
  BarSeries,
  AreaSeries,
  CandlestickSeries,
  BollingerSeries,
  LineSeries,
  RSISeries,
  MACDSeries
} from "react-stockcharts/lib/series";
import { XAxis, YAxis } from "react-stockcharts/lib/axes";
import {
  CrossHairCursor,
  EdgeIndicator,
  CurrentCoordinate,
  MouseCoordinateX,
  MouseCoordinateY,
} from "react-stockcharts/lib/coordinates";
import algo from "react-stockcharts/lib/algorithm";
import {
  LabelAnnotation,
  Annotate,
  SvgPathAnnotation,
  buyPath,
  sellPath
} from "react-stockcharts/lib/annotation";
import { discontinuousTimeScaleProvider } from "react-stockcharts/lib/scale";
import {
  OHLCTooltip,
  MovingAverageTooltip,
  BollingerBandTooltip,
  RSITooltip,
  SingleValueTooltip,
  MACDTooltip
} from "react-stockcharts/lib/tooltip";
import { ema, rsi, sma, atr, bollingerBand, macd } from "react-stockcharts/lib/indicator";
import { fitWidth } from "react-stockcharts/lib/helper";
import { last } from "react-stockcharts/lib/utils";

const bbStroke = {
  top: "#964B00",
  middle: "#000000",
  bottom: "#964B00",
};

const bbFill = "#4682B4";

const macdAppearance = {
  stroke: {
    macd: "#FF0000",
    signal: "#00F300",
  },
  fill: {
    divergence: "#4682B4"
  },
};

const mouseEdgeAppearance = {
  textFill: "#542605",
  stroke: "#05233B",
  strokeOpacity: 1,
  strokeWidth: 3,
  arrowWidth: 5,
  fill: "#BCDEFA",
};

const annotationProps = {
  fontSize: 18,
  fill: d => {
    if (d.text === 'b') return '#35FF35';
    if (d.text === 's') return '#FF3535';
    if (d.text === 'ep') return '#00FF00';
    if (d.text === 'en') return '#FF0000';
    if (d.text === 'ez') return '#0000FF';
  },
  opacity: 0.8,
  text: d => d.text,
  y: ({ yScale }) => yScale.range()[0],
};

const defaultAnnotationProps = {
  onClick: console.log.bind(console),
};

const longAnnotationProps = {
  ...defaultAnnotationProps,
  y: ({ yScale, datum }) => yScale(datum.low),
  fill: "#006517",
  path: buyPath,
  tooltip: "Go long",
};

const shortAnnotationProps = {
  ...defaultAnnotationProps,
  y: ({ yScale, datum }) => yScale(datum.high),
  fill: "#FF0000",
  path: sellPath,
  tooltip: "Go short",
};

class MyCandleStickChartWithIndicators extends React.Component {
  render() {
    const ema26 = ema()
      .options({ windowSize: 26 })
      .merge((d, c) => { d.ema26 = c; })
      .accessor(d => d.ema26);

    const ema12 = ema()
      .options({ windowSize: 12 })
      .merge((d, c) => { d.ema12 = c; })
      .accessor(d => d.ema12);

    const smaVolume50 = sma()
      .options({ windowSize: 50, sourcePath: "volume" })
      .merge((d, c) => { d.smaVolume50 = c; })
      .accessor(d => d.smaVolume50);

    const rsiCalculator = rsi()
      .options({ windowSize: 14 })
      .merge((d, c) => { d.rsi = c; })
      .accessor(d => d.rsi);

    const atr14 = atr()
      .options({ windowSize: 14 })
      .merge((d, c) => { d.atr14 = c; })
      .accessor(d => d.atr14);

    const bb = bollingerBand()
      .options({
        windowSize: 20,
        multiplier: 2,
        movingAverageType: 'sma',
        sourcePath: 'close'
      })
      .merge((d, c) => { d.bb = c; })
      .accessor(d => d.bb);

    const macdCalculator = macd()
      .options({
        fast: 5,
        slow: 8,
        signal: 3,
      })
      .merge((d, c) => { d.macd = c; })
      .accessor(d => d.macd);

    const buySell = algo()
      .windowSize(2)
      .accumulator(([prev, now]) => {
        if (now.text === 'b') return "LONG";
        if (now.text === 's') return "SHORT";
      })
      .merge((d, c) => { d.longShort = c; });

    const { type, data: initialData, width, ratio } = this.props;

    const calculatedData = buySell(smaVolume50(rsiCalculator(atr14(bb(macdCalculator(ema12(ema26(initialData))))))));
    console.log(calculatedData);
    const xScaleProvider = discontinuousTimeScaleProvider
      .inputDateAccessor(d => d.date);
    const {
      data,
      xScale,
      xAccessor,
      displayXAccessor,
    } = xScaleProvider(calculatedData);

    const start = xAccessor(last(data));
    const end = xAccessor(data[Math.max(0, data.length - 150)]);
    const xExtents = [start, end];

    return (
      <ChartCanvas height={880}
        width={width}
        ratio={ratio}
        margin={{ left: 70, right: 70, top: 20, bottom: 30 }}
        type={type}
        seriesName="ToTheTop"
        data={data}
        xScale={xScale}
        xAccessor={xAccessor}
        displayXAccessor={displayXAccessor}
        xExtents={xExtents}
      >

        <Chart id={1} height={270}
          yExtents={[d => [d.high, d.low], ema26.accessor(), ema12.accessor()]}
          padding={{ top: 10, bottom: 20 }}
        >
          <XAxis axisAt="bottom" orient="bottom" showTicks={false} outerTickSize={0} />
          <YAxis axisAt="right" orient="right" ticks={5} />

          <MouseCoordinateY
            at="right"
            orient="right"
            displayFormat={format(".2f")} />

          <CandlestickSeries />
          <BollingerSeries yAccessor={d => d.bb}
            stroke={bbStroke}
            fill={bbFill} />
          <LineSeries yAccessor={ema26.accessor()} stroke={ema26.stroke()} />
          <LineSeries yAccessor={ema12.accessor()} stroke={ema12.stroke()} />

          <CurrentCoordinate yAccessor={ema26.accessor()} fill={ema26.stroke()} />
          <CurrentCoordinate yAccessor={ema12.accessor()} fill={ema12.stroke()} />

          <EdgeIndicator itemType="last" orient="right" edgeAt="right"
            yAccessor={d => d.close} fill={d => d.close > d.open ? "#6BA583" : "#FF0000"} />

          <OHLCTooltip xDisplayFormat={timeFormat("%Y-%m-%d %H:%M")} origin={[-40, 0]} />

          <MovingAverageTooltip
            onClick={e => console.log(e)}
            origin={[-38, 15]}
            options={[
              {
                yAccessor: ema26.accessor(),
                type: "EMA",
                stroke: ema26.stroke(),
                windowSize: ema26.options().windowSize,
              },
              {
                yAccessor: ema12.accessor(),
                type: "EMA",
                stroke: ema12.stroke(),
                windowSize: ema12.options().windowSize,
              },
            ]}
          />
          <BollingerBandTooltip
            origin={[-38, 60]}
            yAccessor={d => d.bb}
            options={bb.options()} />

          <Annotate with={LabelAnnotation}
            when={d => d.text.length > 0}
            usingProps={annotationProps} />

          <Annotate with={SvgPathAnnotation} when={d => d.longShort === "LONG"}
            usingProps={longAnnotationProps} />

          <Annotate with={SvgPathAnnotation} when={d => d.longShort === "SHORT"}
            usingProps={shortAnnotationProps} />
        </Chart>
        <Chart id={2} height={150}
          yExtents={[d => d.volume, smaVolume50.accessor()]}
          origin={(w, h) => { console.log('chart id 2:', w, h); return [0, h - 550] }}
        >
          <YAxis axisAt="left" orient="left" ticks={5} tickFormat={format(".2s")} />

          <MouseCoordinateY
            at="left"
            orient="left"
            displayFormat={format(".4s")} />

          <BarSeries yAccessor={d => d.volume} fill={d => d.close > d.open ? "#6BA583" : "#FF0000"} />
          <AreaSeries yAccessor={smaVolume50.accessor()} stroke={smaVolume50.stroke()} fill={smaVolume50.fill()} />
        </Chart>
        <Chart id={3}
          yExtents={[0, 100]}
          height={125} origin={(w, h) => { console.log('chart id 3:', w, h); return [0, h - 275] }}
        >
          <XAxis axisAt="bottom" orient="bottom" showTicks={false} outerTickSize={0} />
          <YAxis axisAt="right"
            orient="right"
            tickValues={[30, 50, 70]} />
          <MouseCoordinateY
            at="right"
            orient="right"
            displayFormat={format(".2f")} />

          <RSISeries yAccessor={d => d.rsi} />

          <RSITooltip origin={[-38, 15]}
            yAccessor={d => d.rsi}
            options={rsiCalculator.options()} />
        </Chart>
        <Chart id={4}
          yExtents={atr14.accessor()}
          height={125} origin={(w, h) => [0, h - 400]} padding={{ top: 10, bottom: 10 }}
        >
          <XAxis axisAt="bottom" orient="bottom" />
          <YAxis axisAt="right" orient="right" ticks={2} />

          <MouseCoordinateX
            at="bottom"
            orient="bottom"
            displayFormat={timeFormat("%Y-%m-%d %H:%M")} />
          <MouseCoordinateY
            at="right"
            orient="right"
            displayFormat={format(".2f")} />

          <LineSeries yAccessor={atr14.accessor()} stroke={atr14.stroke()} />
          <SingleValueTooltip
            yAccessor={atr14.accessor()}
            yLabel={`ATR (${atr14.options().windowSize})`}
            yDisplayFormat={format(".2f")}
            // valueStroke={atr14.stroke()} - optional prop
            // labelStroke="#4682B4" - optional prop
            origin={[-40, 15]} />
        </Chart>
        <Chart id={5} height={150}
          yExtents={macdCalculator.accessor()}
          origin={(w, h) => [0, h - 150]} padding={{ top: 10, bottom: 10 }}
        >
          <XAxis axisAt="bottom" orient="bottom" />
          <YAxis axisAt="right" orient="right" ticks={2} />

          <MouseCoordinateX
            at="bottom"
            orient="bottom"
            displayFormat={timeFormat("%Y-%m-%d")}
            rectRadius={5}
            {...mouseEdgeAppearance}
          />
          <MouseCoordinateY
            at="right"
            orient="right"
            displayFormat={format(".2f")}
            {...mouseEdgeAppearance}
          />

          <MACDSeries yAccessor={d => d.macd}
            {...macdAppearance} />
          <MACDTooltip
            origin={[-38, 15]}
            yAccessor={d => d.macd}
            options={macdCalculator.options()}
            appearance={macdAppearance}
          />
        </Chart>
        <CrossHairCursor />
      </ChartCanvas>
    );
  }
}

MyCandleStickChartWithIndicators.propTypes = {
  data: PropTypes.array.isRequired,
  width: PropTypes.number.isRequired,
  ratio: PropTypes.number.isRequired,
  type: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
};

MyCandleStickChartWithIndicators.defaultProps = {
  type: "svg",
};
MyCandleStickChartWithIndicators = fitWidth(MyCandleStickChartWithIndicators);

export default MyCandleStickChartWithIndicators;
