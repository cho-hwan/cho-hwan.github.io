---
title: Spectral Graph Theory
description: Bridging Continuous and Discrete
date: 2026-07-01
categories:
  - Personal
tags:
  - "#math"
pin: true
math: true
author: ch
---


**Reference**

1. [Lecture ORIE 6334 Bridging Continuous Discrete Optimization](https://people.orie.cornell.edu/dpw/orie6334/)

2. [Daniel A. Spielman - Spectral Graph Theory](https://www.cs.yale.edu/homes/spielman/561/syllabus.html)

3. [Youtube Algorithm Course - Graph Theory from a Google Engineer](https://www.youtube.com/watch?v=09_LlHjoEiY&t=9751s)

위 자료들을 참고했습니다. 좋은 자료를 제공해주셔서 감사합니다.

---

이산적인 대상을 연속적인 도구로 풀어내기 위해 중요한 도구들을 정리한 포스팅입니다.

*처음 나오는 용어의 경우 직역을 포함해서 서술합니다. 그러나 용어는 기본적으로 영문을 사용합니다.*

## Moore graphs and the Hoffman–Singleton theorem

그래프의 지름(diameter) $D$는 그래프의 어떤 노드에서 다른 어떤 노드로든 이동할 수 있음을 보장하기 위해 필요한 최소 이동 거리입니다. 아래와 같이 정리할 수 있습니다.

$$D = \underset{i,j \in V}{\max} \ \text{"length of shortest path between } i \text{ and } j\text{"}$$

모든 노드의 차수(degree)가 $d$일 때 그 그래프를 $d\text{-regular}$하다고 합니다. 여기서 degree란 각 노드에 연결된 간선의 개수를 의미합니다. 아래 그래프는 diameter가 2이지만, 어떤 노드는 degree가 2이고 어떤 노드는 degree가 3이므로 $d\text{-regular}$가 아닙니다.

![a](</assets/post/2026-07-01-Spectral Graph Theory Basic/1_1.png>)


이 글에서는 $diameter=2$인 $d\text{-regular}$ 그래프 중 노드 수가 최대한 많은 그래프를 다룹니다. 임의의 $d\text{-regular}$ 그래프를 노드 $i$에서 시작해 트리 형태로 층별로 펼쳐 그리면 아래와 같은 형태가 됩니다.

![b](</assets/post/2026-07-01-Spectral Graph Theory Basic/1_2.png>)

각 노드의 degree는 $d$로 고정되어 있으므로($d\text{-regular}$ 그래프를 특정 노드를 기준으로 트리 형태로 펼친 것이니까요), 첫 번째 층의 노드들끼리 연결되면(그림의 빨간 점선) 그 간선만큼 새로운 노드로 뻗어나갈 수 없어 전체 노드 수가 줄어듭니다. 따라서 노드 수를 최대화하려면 같은 층의 노드 사이에는 연결이 없어야 합니다. 같은 이유로 이런 그래프에는 삼각형이나 사각형이 존재할 수 없습니다. 이 조건에서 그래프는 $n = 1 + d + d(d-1) = d^2 + 1$개의 노드를 갖습니다. 이렇게 노드 수의 상한을 달성하는 그래프를 **Moore graph**라고 부릅니다.

그래프 $G$의 인접 행렬(adjacency matrix)을 $A = (a_{ij})$라고 하면 $a_{ij}$는 아래와 같이 정의할 수 있습니다.

$$a_{ij} =
\begin{cases}
1 & \text{if } (i,j) \in E \\
0 & \text{otherwise.}
\end{cases}$$

만약 $B = A^2$라면 어떻게 될까요?


$$b_{ij} = \sum_{k} a_{ik} a_{kj} = \text{ number of walks of 2 steps in graph } G \text{ from } i \text{ to } j.$$

그래프가 $d\text{-regular}$이므로 $b_{ii} = d$입니다. 노드 $i$에서 $1 \text{ step}$에 도달할 수 있는 정점이 $d$개이고, 각각에서 곧바로 되돌아오면 $2 \text{ step}$이 되기 때문입니다. 또한 노드 $i$에서 시작하면 그래프의 다른 모든 정점에 정확히 $\text{1 or 2 or 3 step}$ 중 하나의 방법으로만(exclusive or) 도달한다는 것도 확인할 수 있습니다. 따라서 다음이 성립합니다.

$$I + A + A^2 - dI = J$$


여기서 $I$는 Identity matrix, $J$는 all-ones matrix입니다.


> 이 챕터의 핵심이라고 생각되는 내용인데요, "지름 2인 $d\text{-regular}$ 그래프"라는 조합적 조건을 행렬 방정식으로 표현하면서 이산적인 그래프를 연속적인 방식으로 다룰 수 있게되었습니다. 성분별로 읽으면, $i \ne j$일 때 $a_{ij} + b_{ij} = 1$, 즉 서로 다른 두 노드는 거리 1이거나 거리 2 중 정확히 하나라는 뜻입니다.


이제 symmetric matrix $A \in \mathbb{R}^{n \times n}$를 해석하기 위해 아래의 선형대수학 정의를 사용합니다.

- symmetric matrix의 모든 고유값은 실수(R)입니다.
- 고유값 $\lambda_1, \dots, \lambda_n$(이를 spectrum이라 부릅니다)과 고유벡터 $x_1, \dots, x_n$가 존재하여, $i \ne j$이면 $\langle x_i, x_j \rangle = x_i^T x_j = 0$입니다.
- 대각합(trace)에 대해 $tr(A) = \sum_{i=1}^{n} a_{ii} = \sum_{i=1}^{n} \lambda_i$입니다.


**존재성 (Existence)**

지금까지 지름 2인 $d\text{-regular}$ 그래프의 구조를 따져봤습니다. 그런데 이런 그래프가 실제로 존재할까요? 저도 잘 모르는데 일단 강의 내용을 따라가봅니다.

먼저 $e = (1, \dots, 1)^T$를 모든 성분이 1인 벡터라 하면, 그래프가 $d\text{-regular}$이므로 행렬의 대각화 법칙에 따라$Ae = de$입니다. 즉 $e$는 $A$의 고유벡터이고 $d$는 그에 대응하는 고유값입니다. 또한

$$A^2 e = A(Ae) = A(de) = d(Ae) = d^2 e$$

이므로,

$$
\begin{aligned}
(I + A + A^2 - dI)e &= Je \\
e + de + d^2 e - de &= ne
\end{aligned}
$$

따라서 $n = d^2 + 1$가 됩니다.

이제 $e$와 직교하는 $A$의 다른 고유벡터 $v$를 생각해봅시다. $v^T e = 0$이므로 $Jv = 0$입니다. 어떤 고유값 $\lambda$에 대해 $Av = \lambda v$이고, $A^2 v = A(Av) = A(\lambda v) = \lambda^2 v$입니다. 따라서

$$
\begin{aligned}
(I + A + A^2 - dI)v &= Jv \\
v + \lambda v + \lambda^2 v - dv &= 0 \\
\implies 1 + \lambda + \lambda^2 - d &= 0
\end{aligned}
$$

그러므로 $e$에 대응하지 않는 모든 고유값은

$$\lambda = \frac{-1 \pm \sqrt{4d-3}}{2}$$

입니다.

이제 Moore graph의 Adjacency Matrix A는 self-loop가 없으므로 $tr(A)=\sum_{i=1}^{n} \lambda_{i} = 0$ 이라는 성질을 활용합니다. 

성질을 활용하면 $\sqrt{4d-3}$가 무리수인 경우와 유리수인 경우 두가지로 나눠서 바라볼 수 있게됩니다.

**Case 1. $\sqrt{4d-3}$이 무리수인 경우**

trace의 합이 0이 되려면(=무리수 부분이 소거되려면) 두 고유값 $\frac{-1+\sqrt{4d-3}}{2}$와 $\frac{-1-\sqrt{4d-3}}{2}$의 중복도(multiplicity)가 각각 $\frac{n-1}{2}$로 같아야 합니다. 이를 대입하면

$$
\begin{aligned}
tr(A) = 0 &= d + \frac{n-1}{2}\left( \frac{-1+\sqrt{4d-3}}{2} + \frac{-1-\sqrt{4d-3}}{2} \right) \\
&= d - \frac{n-1}{2} = d - \frac{d^2}{2} \\
&\implies d = 0 \text{ 또는 } d = 2
\end{aligned}
$$

가능한 그래프는 다음뿐입니다.

-  $d = 0$ : Moore bound ($n=d^2+1$)에 대입하면 $n=1$이 됩니다. 즉 정점이 하나뿐이고 간선은 없는 그래프입니다. 이 그래프는 서로 다른 두 정점이 존재하지 않으므로 찾고 있는 지름이 2인 그래프에는 해당하지 않습니다.

-  $d = 2$:  ($n=d^2+1=5$)이므로 정점이 $5$개입니다. 또한 모든 정점의 $degree$가 $2$여야 하므로, 연결 그래프라면 다섯 정점이 하나의 고리를 이루는 5-cycle 이 됩니다. C_5에서는 서로 이웃한 정점까지의 거리는 1이고, 이웃하지 않은 정점까지도 최대 2번의 이동이면 도달할 수 있으므로 $diameter$가 2입니다. 따라서 $d=2$인 경우에는 Moore graph가 존재합니다.

**Case 2. $\sqrt{4d-3}$이 유리수인 경우**

![b](</assets/post/2026-07-01-Spectral Graph Theory Basic/1_3.png>)

$s^2 = 4d - 3$이라 하고, 고유값 $\frac{-1+s}{2}$의 중복도를 $m$이라 합시다. 그러면

$$
\begin{aligned}
tr(A) &= d + m\left( \frac{-1+s}{2} \right) + (n-1-m)\left( \frac{-1-s}{2} \right) \\
&= 0
\end{aligned}
$$

$d = \frac{1}{4}(s^2 + 3)$이라는 사실을 이용하면 $n - 1 = d^2 = \frac{1}{16}(s^4 + 6s^2 + 9)$를 얻습니다. 계속하면

$$0 = \frac{1}{4}(s^2+3) + m\left( \frac{-1+s}{2} \right) + \left( \frac{1}{16}(s^4 + 6s^2 + 9) - m \right)\left( \frac{-1-s}{2} \right)$$

식을 정리하면 다음을 얻습니다.

$$-s^5 - s^4 - 6s^3 + 2s^2 + (32m - 9)s + 15 = 0$$

유리근 정리(rational root theorem)에 의해 이 다항식의 정수해 $s$는 15의 약수여야 합니다. 따라서 가능한 근을 전부 나열할 수 있습니다.

> 여기가 핵심 뽀인뜨입니다. 고유값 자체는 연속적인 값이지만, 중복도 $m$은 "그 고유값이 몇 개냐"이므로 반드시 음이 아닌 정수여야 합니다. 이 정수 조건이 연속적인 계산에 이산적인 제약을 걸어서 가능한 $s$를 유한집합으로 제한합니다.

가능한 경우는 다음과 같습니다.

**(a)** $s = 1, d = 1, n = 2$:

![b](</assets/post/2026-07-01-Spectral Graph Theory Basic/1_4.png>)

2개 노드의 1-regular 그래프는 간선 하나짜리 그래프인데, 지름이 2가 아닙니다.

**(b)** $s = 3, d = 3, n = 10$:

<div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
  <img src="/assets/post/2026-07-01-Spectral Graph Theory Basic/1_5.png" alt="5" width="300" height="300">
  <img src="/assets/post/2026-07-01-Spectral Graph Theory Basic/1_6.png" alt="6" width="300" height="300">
</div>


이 경우에 나오는 그래프가 바로 **Petersen graph**입니다. 같은 그래프라도 그리는 방식은 여러 가지인데, 앞에서처럼 한 정점을 기준으로 층별로 펼쳐 그릴 수도 있고, 흔히 볼 수 있는 별 모양의 형태로도 표현할 수 있습니다.

Petersen graph는 그래프 이론에서 꽤 자주 등장하는 유명한 그래프입니다. 정점마다 정확히 3개의 간선이 연결된 **3-regular(cubic) graph**이면서, 어떤 간선을 하나 제거해도 그래프가 끊어지지 않는 **bridgeless graph**입니다.

특히 간선을 세 가지 색으로 칠하되 한 정점에서 만나는 세 간선의 색이 모두 다르게 하려는 **3-edge-coloring**이 불가능하다는 성질로 잘 알려져 있습니다. 또한 Hamiltonian cycle도 존재하지 않습니다.

찾아보니 이처럼 Petersen graph는 겉보기에는 단순해 보이지만 여러 성질에서 예상과 어긋나는 모습을 보여준다고 합니다. 그래서 그래프 이론에서 어떤 명제가 항상 성립할 것이라고 생각했을 때, 반례를 찾는 과정에서 자주 등장하는 대표적인 그래프 중 하나라고 하네요.

**(c)** $s = 5, d = 7, n = 50$:

![b](</assets/post/2026-07-01-Spectral Graph Theory Basic/1_7.webp>)

이 경우에는 실제로 조건을 만족하는 그래프가 존재하며, 이를 **Hoffman-Singleton graph**라고 부릅니다. 이름 그대로 Alan Hoffman과 Robert Singleton이 Moore graph를 분류하는 과정에서 1960년에 발견한 그래프입니다.

Hoffman-Singleton graph는 정점이 50개이고, 모든 정점의 degree가 7인 **7-regular graph**입니다. 간선은 총 175개이며 diameter는 2입니다. 즉 정점이 50개나 되지만, 아무 두 정점을 골라도 최대 두 번의 이동만으로 도달할 수 있습니다. 또한 삼각형이나 사각형이 없어서 girth는 5입니다.

앞에서 구한 Moore bound에 $d=7$을 대입해보면$n=7^2+1=50$이 나오는데, Hoffman-Singleton graph는 실제로 정확히 50개의 정점을 가지므로 이 상한을 달성합니다. 따라서 단순히 조건을 만족하는 7-regular graph가 아니라, $d=7$, $diameter = 2$인 **Moore graph** 그 자체입니다.

조금 더 흥미로운 점은 이런 조건을 만족하는 그래프가 여러 개 존재하는 것이 아니라, 동형(Isomorphism)을 제외하면 Hoffman-Singleton graph이 유일하다는 것입니다. 즉 정점의 이름이나 그림을 그리는 방식만 바꾼 것을 같은 그래프로 본다면, $d=7$인 경우의 Moore graph는 사실상 유일합니다.

스펙트럼도 앞에서 계산한 식과 정확히 맞아떨어집니다. $d=7$이면 $\frac{-1\pm\sqrt{4d-3}}{2} = \frac{-1\pm5}{2}$ 이므로 나머지 고유값은 $2$와$-3$이 됩니다. 실제 Hoffman-Singleton graph의 spectrum은 $7^1, 2^{28}, (-3)^{21}$입니다. 즉 앞에서 trace와 고유값을 이용해 얻어낸 조건이 단순히 필요조건으로 끝나는 것이 아니라, 실제로 존재하는 그래프에서도 그대로 나타나는 것을 확인할 수 있습니다.

**(d)** $s = 15, d = 57, n = 3250$:

이 경우는 조금 특별합니다. 앞의 $d=2,3,7$인 경우와 달리, $d=57$인 Moore graph가 실제로 존재하는지 아직까지 밝혀지지 않았습니다.

만약 존재한다면 정점의 수는 Moore bound에 의해

$$  
n=d^2+1=57^2+1=3250  
$$

이 되어야 하고, 모든 정점의 degree가 57이면서 diameter가 2인 그래프여야 합니다. 하지만 지금까지 이런 그래프를 실제로 구성한 사람은 없고(제가 아는바에 따르면..), 반대로 이런 그래프가 존재할 수 없다는 증명도 나오지 않았습니다. 따라서 $d=57$인 경우는 여전히 미해결 문제로 남아 있는 것으로 보여집니다.

정리하면 diameter가 2인 Moore graph가 존재할 수 있는 degree는

$$  
d \in {2,3,7,57}  
$$

로 제한됩니다. 이 결과가 바로 **Hoffman-Singleton theorem**입니다.

여기서 재미있는 점은 처음 시작한 문제가 굉장히 이산적이였다는 것입니다. 분명 시작은 “모든 정점의 degree가 $d$이고, 아무 두 정점 사이의 거리가 최대 2일 때 정점을 최대 몇 개까지 넣을 수 있을까?”라는 그래프의 연결 구조에 대한 질문이였습니다.

그런데 이를 adjacency matrix로 옮기고, 고윳값과 trace를 이용해 분석하자 가능한 $d$의 값이 단 네 개로 좁혀졌습니다. 즉 그래프라는 이산적인 대상을 행렬과 고유값이라는 연속적인 도구로 분석한 셈입니다.

블로그를 작성하며 진행했던 과정을 돌아보니 교수님께서 첫 강의때 학생들에게 이산과 연속의 경계와 관계에 대해 알려주려고 하셨던 것 같다는 생각이 드네요.

