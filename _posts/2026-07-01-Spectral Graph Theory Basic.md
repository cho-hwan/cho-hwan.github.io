---
title: Graph Sparsification
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

1. [Lectue ORIE 6334 Bridging Continuous Discrete Optimization](https://people.orie.cornell.edu/dpw/orie6334/)

2. [Daniel A. Spielman - Spectral Graph Theory ](https://www.cs.yale.edu/homes/spielman/561/syllabus.html)
   
3. [Youtube Algorithm Course - Graph Theory from a Google Engineer](https://www.youtube.com/watch?v=09_LlHjoEiY&t=9751s)

위 자료들을 참고했습니다. 좋은 자료를 제공해주셔서 감사합니다.

---

조합론적 질문을 연속적인 도구로 풀어내는 과정이 꽤나 재밌다. 그 과정을 담았다.

*처음 나오는 용어의 경우 직역을 포함해서 서술합니다. 그러나 용어는 기본적으로 영문을 사용합니다.*

## Moore Graph와 Hoffman-Singleton 정리

그래프의 지름(diameter) $D$는 그래프의 어떤 노드에서 다른 어떤 노드로든 이동할 수 있음을 보장하기 위해 필요한 최소 이동 거리입니다. 아래와 같이 정리할 수 있다.

$$D = \underset{i,j \in V}{max} \ \text{"length of shortest path between } i\  \text{and} j\ \text{"}$$

모든 노드의 차수(degree)가 $d$일 때 그 그래프를 $\text{d-regular}$ 하다고 한다. 여기서 $degree$란 각 정점에 연결된 간선의 개수를 말한다. 아래 그래프는 $diameter$가 2이지만, 어떤 노드는 $degree$가 2이고 어떤 노드는 $degree$가 3이므로 $\text{d-regular}$ 가 아니다.

![a](</assets/post/2026-07-01-Spectral Graph Theory Basic/1_1.png>)


지름이 2인 $\text{d-regular}$그래프 중 노드 수가 최대한 많은 것을 다룬다. 임의의 $\text{d-regular}$그래프를 노드 $i$에서 시작해 트리형태로 층별로 펼쳐 그리면 아래와 같은 형태가 된다.

![b](</assets/post/2026-07-01-Spectral Graph Theory Basic/1_2.png>)

각 노드의 $degree$는 $d$로 고정($\text{d-regular}$그래프를 특정 노드를 기준으로 트리형태로 펼친것이니)되어 있으므로 첫 번째 층의 노드들끼리 연결되면(그림의 빨간 점선) 그 간선만큼 새로운 노드로 뻗어나갈 수 없어 전체 노드 수가 줄어든다. 따라서 노드 수를 최대화하려면 같은 층의 노드 사이에는 연결이 없어야 한다. 같은 이유로 이런 그래프에는 삼각형이나 사각형이 존재할 수 없다. 이 조건에서 그래프는 $n=1+d+d(d−1)=d^2+1$개의 노드를 갖는다.

그래프 G의 인접 행렬(adjacency matrix)을 $A = (a_{ij})$라고 하면 $a$는 아래와 같이 정의 가능하다.

$$a_{ij} = 
\begin{cases}
1 & \text{if } (i,j) \in E \\
0 & \text{otherwise.}
\end{cases}$$

만약 $B = A^2$라면?


$$b_{ij} = \sum_{k} a_{ik} a_{kj} = \text{ number of walks of 2 steps in graph } G \text{ from } i \text{ to } j.$$

그래프가 $d\text{-regular}$이므로 $b_{ii} = d$이다. 노드 $i$에서 한 걸음에 도달할 수 있는 정점이 $d$개이고, 각각에서 곧바로 되돌아오면 2걸음 걷기가 되기 때문이다. 또한 노드 $i$에서 시작하면 그래프의 다른 모든 정점에 정확히 0걸음, 정확히 1걸음, 또는 정확히 2걸음 중 하나의 방법으로만(exclusive or) 도달한다는 것도 어렵지 않게 확인할 수 있다. 따라서 다음이 성립한다.

$$I + A + A^2 - dI = J$$


여기서 $I$는 항등행렬(identity matrix), $J$는 모든 성분이 1인 행렬이다.


> **참고.** 이 식이 이 강의의 핵심이다. "지름 2인 $d\text{-regular}$ 그래프"라는 조합적 조건이 행렬 방정식 하나로 완전히 번역되었다. 성분별로 읽으면, $i \ne j$일 때 $a_{ij} + b_{ij} = 1$, 즉 서로 다른 두 노드는 거리 1이거나 거리 2 중 정확히 하나라는 뜻이다.


이제 선형대수에서 다음 사실들이 필요하다.

Fact 1. 대칭행렬 $A \in \mathbb{R}^{n \times n}$에 대해 다음이 성립한다.

- $A$의 모든 고유값은 실수이다.
- 고유값 $\lambda_1, \dots, \lambda_n$(이를 스펙트럼(spectrum)이라 부른다)과 고유벡터 $x_1, \dots, x_n$이 존재하여, $i \ne j$이면 $\langle x_i, x_j \rangle = x_i^T x_j = 0$이다.
- 대각합(trace)에 대해 $tr(A) = \sum_{i=1}^{n} a_{ii} = \sum_{i=1}^{n} \lambda_i$이다.


**존재성 (Existence)**

지금까지 지름 2인 $d\text{-regular}$ 그래프의 구조를 따져봤다. 그런데 이런 그래프가 실제로 존재하는가? 이 질문에 답하기 위해 선형대수를 사용한다.

먼저 $e = (1, \dots, 1)^T$를 모든 성분이 1인 벡터라 하면, 그래프가 $d\text{-regular}$이므로 $Ae = de$이다. 즉 $e$는 $A$의 고유벡터이고 $d$는 그에 대응하는 고유값이다. 또한

$$A^2 e = A(Ae) = A(de) = d(Ae) = d^2 e$$

이므로,

$$ \begin{aligned} (I + A + A^2 - dI)e &= Je \ e + de + d^2 e - de &= ne \end{aligned} $$

따라서 $n = d^2 + 1$인데, 이건 이미 알고 있던 사실이다.

이제 $e$와 직교하는 $A$의 다른 고유벡터 $v$를 생각하자. $v^T e = 0$이므로 $Jv = 0$이다. 어떤 고유값 $\lambda$에 대해 $Av = \lambda v$이고, $A^2 v = A(Av) = A(\lambda v) = \lambda^2 v$이다. 따라서

$$ \begin{aligned} (I + A + A^2 - dI)v &= Jv \ v + \lambda v + \lambda^2 v - \lambda v &= 0 \ \implies 1 + \lambda + \lambda^2 - d &= 0 \end{aligned} $$

그러므로 $e$에 대응하지 않는 모든 고유값은

$$\lambda = \frac{-1 \pm \sqrt{4d-3}}{2}$$

이다.

고유값들을 알았으니 무엇을 할 수 있을까? trace를 쓰면 된다! 그래프에 self-loop가 없으므로 모든 $i$에 대해 $a_{ii} = 0$이고, 따라서 $tr(A) = 0$이다. 이제 두 가지 경우를 나눠 생각한다.

**Case 1. $\sqrt{4d-3}$이 무리수인 경우**

trace의 합이 0이 되려면(무리수 부분이 소거되려면) 두 고유값 $\frac{-1+\sqrt{4d-3}}{2}$와 $\frac{-1-\sqrt{4d-3}}{2}$의 중복도(multiplicity)가 각각 $\frac{n-1}{2}$로 같아야 한다. 이를 대입하면

$$ \begin{aligned} tr(A) = 0 &= d + \frac{n-1}{2}\left( \frac{-1+\sqrt{4d-3}}{2} + \frac{-1-\sqrt{4d-3}}{2} \right) \ &= d - \frac{n-1}{2} = d - \frac{d^2}{2} \ &\implies d = 0 \text{ 또는 } d = 2 \end{aligned} $$

가능한 그래프는 다음뿐이다.

(a). $d = 0$이면 그래프는 노드 하나뿐이고, 지름이 2가 아니다.

(b). $d = 2$이면 $n = 5$이다. 이는 5-cycle이며, 실제로 지름 2인 2-regular 그래프이다.

**Case 2. $\sqrt{4d-3}$이 유리수인 경우**

![b](</assets/post/2026-07-01-Spectral Graph Theory Basic/1_3.png>)

$s^2 = 4d - 3$이라 하고, 고유값 $\frac{-1+s}{2}$의 중복도를 $m$이라 하자. 그러면

$$ \begin{aligned} tr(A) &= d + m\left( \frac{-1+s}{2} \right) + (n-1-m)\left( \frac{-1-s}{2} \right) \ &= 0 \end{aligned} $$

$d = \frac{1}{4}(s^2 + 3)$이라는 사실을 이용하면 $n - 1 = d^2 = \frac{1}{16}(s^4 + 6s^2 + 9)$를 얻는다. 계속하면

$$0 = \frac{1}{4}(s^2+3) + m\left( \frac{-1+s}{2} \right) + \left( \frac{1}{16}(s^4 + 6s^2 + 9) - m \right)\left( \frac{-1-s}{2} \right)$$

식을 정리하면 다음을 얻는다.

$$-s^5 - s^4 - 6s^3 + 2s^2 + (32m - 9)s + 15 = 0$$

유리근 정리(rational root theorem)에 의해 이 다항식의 해는 15의 약수여야 한다. 따라서 가능한 근을 전부 나열할 수 있다.

> **참고.** 여기가 이 논증의 핵심인 듯 하다. 고유값 자체는 연속적인 값이지만, 중복도 $m$은 "그 고유값이 몇 개냐"이므로 반드시 음이 아닌 정수여야 한다. 이 정수 조건이 연속적인 계산에 이산적인 제약을 걸어서 가능한 $s$를 유한 개로 좁혀버린다.

가능한 경우는 다음과 같다.

**(a)** $s = 1, d = 1, n = 2$:

![b](</assets/post/2026-07-01-Spectral Graph Theory Basic/1_4.png>)

2개 노드의 1-regular 그래프는 간선 하나짜리 그래프인데, 지름이 2가 아니다.

**(b)** $s = 3, d = 3, n = 10$:

<div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
  <img src="assets/post/2026-07-01-Spectral Graph Theory Basic/1_5.png" alt="5" width="300" height="300">
  <img src="/assets/post/2026-07-01-Spectral Graph Theory Basic/1_6.png" alt="6" width="300" height="300">
</div>


이 그래프는 두 가지 방식으로 그릴 수 있다. 첫 번째는 앞에서 쓴 것과 같은 층별 다이어그램이고, 두 번째는 **Petersen representation**이라 불리는 그림이다. 이 그래프가 바로 **Petersen graph**다.

Petersen은 3-edge-coloring이 불가능한 가장 작은 cubic(즉 3-regular) bridgeless 그래프를 찾는 과정에서 이 그래프를 발견했다. bridgeless 그래프란 어떤 간선을 제거해도 여전히 연결되어 있는 그래프를 말하고, 3-edge-colorable 그래프란 모든 간선을 세 가지 색 중 하나로 칠하되 각 정점에서 만나는 간선들의 색이 전부 다르게 할 수 있는 그래프를 말한다. Petersen graph는 Hamiltonian cycle이 없는 가장 작은 cubic bridgeless 그래프이기도 하다. Knuth는 Petersen graph를 이렇게 불렀다.

(c). $s = 5, d = 7, n = 50$:


이 그래프는 존재한다고 알려져 있으며 **Hoffman-Singleton graph**라 불린다 (Hoffman, Singleton 1960).

(d). $s = 15, d = 57, n = 3250$:

이 그래프는 아직 존재하지 않는다고 한다.