+++
title = "DuckDB -- 浮点数的压缩"
date = "2024-03-03"
categories = [
    "DataBase",
    "DuckDB",
    "Compression",
    "Alp"
]
commentable = true
nofeed = false
math = true
notaxonomy = false
hidden = true
norobots = false
nodate = false
description = "DuckDB 是一款开源 OLAP 数据库。与 SQLite 类似，本文将介绍DuckDB是如何对它的浮点数数组进行压缩"

+++

浮点数的压缩一直是一个难以解决的问题。因为其在计算机中存储格式的特殊，导致浮点数的压缩率和解压速度都不是那么令人满意。
DuckDB采用了论文 [ALP](https://dl.acm.org/doi/pdf/10.1145/3626717) 中所提出的方法来对浮点数进行压缩，各方面都取得了不错的进展，这篇博客将介绍ALP中的压缩方法。

<div style="text-align: center">
<img src="/pic/duckdb/alp-compare.png"/>
</div>

## 前置知识

### IEEE 754 Double 的表示方法

首先我们来回忆一下浮点数在计算机内部的表示方式。浮点数由三部分组成

1. 符号位 (sign)

2. 指数位 (exponent)

3. 分数位 (fraction)

   

<div style="text-align: center">
<img src="/pic/duckdb/double-represent.png"/>
</div>
我们通过这三部分可以得到浮点数的值为
$$
double = (-1)^{\\sign} \times 2^{(exp-1023)} \times \left(1 + \sum_{i=1}^{52}\left({b_{52-i}} {2^{-i}}\right)\right)
$$

## 压缩

### ALP


### ALPRD