import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import datetime
import os
import argparse

def parse_args():
    parser = argparse.ArgumentParser(description="CCXT Market Data Downloader")

    parser.add_argument(
        "-f",
        "--file",
        type=str,
        default="binance-BTCUSDT-1m.csv",
        # required=True,
        help="File to plot",
    )
    return parser.parse_args()

def dateparse (timestamp):   
    return datetime.datetime.fromtimestamp(float(timestamp)/1000)

args = parse_args()
full_path = os.path.realpath(__file__)
dir_path = os.path.dirname(full_path)
print(dir_path + "\n")
df = pd.read_csv(dir_path + '\\' + args.file, index_col=['Timestamp'], parse_dates=True, date_parser=dateparse)

df.plot()
plt.show()