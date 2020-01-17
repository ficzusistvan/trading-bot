import ccxt
from datetime import datetime, timedelta, timezone
import math
import argparse
import pandas as pd
import os

def parse_args():
    parser = argparse.ArgumentParser(description="CCXT Market Data Downloader")

    parser.add_argument(
        "-s",
        "--symbol",
        type=str,
        default="BCH/USDT",
        # required=True,
        help="The Symbol of the Instrument/Currency Pair To Download",
    )

    parser.add_argument(
        "-e",
        "--exchange",
        type=str,
        default="binance",
        # required=True,
        help="The exchange to download from",
    )

    parser.add_argument(
        "-t",
        "--timeframe",
        type=str,
        default="1m",
        choices=[
            "1m",
            "5m",
            "15m",
            "30m",
            "1h",
            "2h",
            "3h",
            "4h",
            "6h",
            "12h",
            "1d",
            "1M",
            "1y",
        ],
        help="The timeframe to download",
    )

    parser.add_argument("-l", "--limit", type=int,
                        default=1000, help="How much data")

    parser.add_argument("--debug", action="store_true",
                        help=("Print Sizer Debugs"))

    parser.add_argument("-d", "--days", type=int,
                        default=100, help="How many days to query"
                        )

    return parser.parse_args()


# Get our arguments
args = parse_args()

# Get our Exchange
try:
    exchange = getattr(ccxt, args.exchange)()
except AttributeError:
    print("-" * 36, " ERROR ", "-" * 35)
    print(
        'Exchange "{}" not found. Please check the exchange is supported.'.format(
            args.exchange
        )
    )
    print("-" * 80)
    quit()

# Check if fetching of OHLC Data is supported
if exchange.has["fetchOHLCV"] != True:
    print("-" * 36, " ERROR ", "-" * 35)
    print(
        "{} does not support fetching OHLC data. Please use another exchange".format(
            args.exchange
        )
    )
    print("-" * 80)
    quit()

# Check requested timeframe is available. If not return a helpful error.
if (not hasattr(exchange, "timeframes")) or (args.timeframe not in exchange.timeframes):
    print("-" * 36, " ERROR ", "-" * 35)
    print(
        "The requested timeframe ({}) is not available from {}\n".format(
            args.timeframe, args.exchange
        )
    )
    print("Available timeframes are:")
    for key in exchange.timeframes.keys():
        print("  - " + key)
    print("-" * 80)
    quit()

# Check if the symbol is available on the Exchange
exchange.load_markets()
if args.symbol not in exchange.symbols:
    print("-" * 36, " ERROR ", "-" * 35)
    print(
        "The requested symbol ({}) is not available from {}\n".format(
            args.symbol, args.exchange
        )
    )
    print("Available symbols are:")
    for key in exchange.symbols:
        print("  - " + key)
    print("-" * 80)
    quit()


# Get data
header = ["Timestamp", "Open", "High", "Low", "Close", "Volume"]
gdf = pd.DataFrame() # empty dataframe; chunks will be appended to this
dt_timestamp = datetime.now().timestamp() * 1000
last_timestamp = int(
    (datetime.today() - timedelta(days=args.days)).timestamp() * 1000)
while True:
    data = exchange.fetch_ohlcv(
        args.symbol, args.timeframe, last_timestamp, args.limit)
    df = pd.DataFrame(data, columns=header).set_index("Timestamp")
    lastrec = len(df.index) - 1
    first_timestamp = df.index[0]
    last_timestamp = df.index[lastrec]
    delta = last_timestamp - first_timestamp
    print("Downloaded data; last_timestamp: {} --> {} : {} --> {}".format(first_timestamp, last_timestamp,
                                                                          datetime.fromtimestamp(first_timestamp/1000), datetime.fromtimestamp(last_timestamp/1000)))
    gdf = gdf.append(df)
    if last_timestamp + delta > dt_timestamp:
        break
# Save it
symbol_out = args.symbol.replace("/", "")
filename = "{}-{}-{}.csv".format(args.exchange, symbol_out, args.timeframe)
path = os.path.join(os.path.dirname(__file__),filename)
print("Saving to: {}".format(path))
gdf.to_csv(path)
