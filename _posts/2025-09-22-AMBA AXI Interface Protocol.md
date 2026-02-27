---
title: AMBA AXI Interface Protocol
description: Cover into AMBA AXI fundamentals, covering bus arbitration, data ordering, and BFM-based verification.
date: 2025-09-22
categories:
  - Learn
  - Personal
tags:
  - ComputerArchitecture
pin: true
math:
author: ch
---
이 글에서는 업계 표준 버스 규격인 **AMBA AXI**와 **AXI-Stream**, 그리고 **BFM(Bus Functional Model)** 을 활용한 IP 설계 및 검증에 필요한 Bus와 Protocol의 핵심 개념을 다룹니다.

## Bus and Protocol

![BFM](/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/BFM.png)

버스 시스템에서 중요한 것은 하나의 프로세서(Master)에 여러 개의 슬레이브(Slave)가 연결되어 있을 때, 어떤 슬레이브에 접근(Access)하느냐를 정확히 구분하는 것입니다. 이를 **주소 기반 디코딩(Decoding by Address)** 이라 합니다.

### How to select one of many Slaves

![select slaves](/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/select_slaves.png)

여러 슬레이브 중 하나를 선택하는 방식은 크게 두 가지로 나뉩니다.

- **Centralized (중앙 집중형)**: 별도의 Decoder가 주소를 해석하여 데이터가 갈 위치를 직접 선택합니다.
- **Distributed (분산형)**: 모든 블록이 주소를 전달받고, 각자 자신에게 할당된 주소 범위인지 확인하여 응답합니다.

### How to select one of many Masters

![select masters](/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/select_masters.png)

**DMA(Direct Memory Access)** 와 같이 메모리 블록을 직접 옮기며 Bus Operation을 생성하는 주체를 **Master**라고 부릅니다. 

버스는 개념적으로 공유 자원이기 때문에 여러 마스터가 동시에 사용할 수 없습니다. 따라서 누가 버스를 사용할지 결정하는 과정이 필요한데, 이를 **중재(Arbitration)**라고 합니다.

- **Centralized**: 중앙 중재기(Arbiter)가 사용권을 제어하는 방식입니다.
- **Distributed**: 각 모듈이 배타적인 규칙에 따라 사용권을 결정하는 방식입니다.

### Algorithm and issues of Arbitration

중재 알고리즘에서 가장 중요한 고려 사항은 **공정성(Fairness)** 입니다. 여러 모듈이 동시에 버스 사용을 요청할 때, 이들에게 어떻게 공정하게 사용 허가를 줄 수 있을지 고민해야 합니다. 중재 시 발생하는 주요 이슈는 다음과 같습니다.

- **Starvation (기아 현상)**: 특정 블록이 우선순위에 밀려 장시간 아무런 진전(Progress)을 하지 못하는 상태입니다.
- **Livelock**: 블록이 계속 동작은 하고 있으나, 실질적인 작업 결과가 나오지 않는 상태입니다.
- **Deadlock (교착 상태)**: 서로가 서로의 자원을 기다리며 모든 작업이 중단된 상태입니다.

#### Starvation의 사례

![starvation0](/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/starvation0.png)

REQ를 떨어뜨리고 가장 가까운 Rising Edge에 다음 우선순위의 REQ에게 버스를 양도합니다. 순수하게 우선순위(Priority) 기반으로만 중재할 경우, 우선순위가 낮은 REQ4는 굉장히 오랜 시간 동안 버스를 사용하지 못하는 Starvation이 발생합니다. 그렇기에 공정성에 대한 규칙이 필요합니다.

![starvation fairness](/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/starvation_fairness.png)

한번 버스를 사용한 마스터는 대기 중인 다른 마스터들의 요청이 해결될 때까지 잠시 마스킹(Masking)하여 중재 참여를 제한하는 방식으로 Starvation 문제를 하드웨어적으로 해결할 수 있습니다.

### How to use bus more Efficiently

버스 효율성을 높이기 위해 다음 두 가지 지표를 고려할 수 있습니다.

1. **Latency Minimization**: 데이터 요청 후 응답까지 걸리는 시간을 최소화합니다. (Speed)
2. **Throughput Maximization**: 단위 시간당 전송되는 데이터 양을 최대화합니다. (Bandwidth)

이는 처리 속도와 전송 대역폭 사이의 최적화 문제이며, 다양한 알고리즘이 존재합니다.

### Data Ordering

![data_ordering](/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/data_ordering.png)

데이터를 메모리에 저장하는 순서에 따라 두 가지 방식이 있습니다.
- **Big-endian**: 상위 바이트부터 저장 (MIPS, DLX, IBM370 등)
- **Little-endian**: 하위 바이트부터 저장 (Intel, ARM, RISC-V 등)

일반적으로 Little-endian이 사용됩니다. 이를 알아야 하는 이유는 특정 주소의 데이터를 버스를 통해 읽었을 때 버스 라인에 실리는 순서가 달라지기 때문입니다.

![justified_nonjustified_bus](/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/justified_nonjustified_bus.png)

위 그림은 4바이트 데이터 버스에서 데이터 크기(4/2/1 byte)에 따른 전송 방식을 보여줍니다. 크기에 따라 사용하는 Bus Lane이 정해지며, 데이터는 항상 특정 방향으로 정렬되어 전송됩니다. 위 그림은 모두 오른쪽 정렬(Rightmost) 방식을 사용하고 있습니다.

- **Justified bus(정렬 버스)**: 데이터 크기에 따라 사용하는 Bus Lane이 정해지는 방식입니다.
- **Non-justified bus(비정렬 버스)**: 데이터가 실제로 사용하는 레인을 주소(Address)가 결정합니다. **AMBA 버스**가 이 방식에 해당합니다.

### Atomic & mutual exclusion(상호 배제)

![bank_example](/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/bank_example.png)

하나의 계좌에서 동시에 결제가 이루어진다고 가정해 봅시다. 잔액을 읽고(Read), 차감한 뒤 다시 저장(Write)하는 과정이 동시에 발생하면 데이터 오류가 생깁니다. 이를 소프트웨어적으로 세마포어 등을 통해 상호 배제하며, 이를 지원하는 하드웨어 기능을 **원자성 연산(Atomic Operation)** 이라고 합니다.

<div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
  <img src="/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/atomic_operation1.png" alt="atomic operation1" width="300" height="200">
  <img src="/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/atomic_operation2.png" alt="atomic operation2" width="300" height="200">
</div>

Read 동작 시점에 Lock을 걸어 방해받지 않도록 하고, Write가 끝날 때까지 Lock을 유지하여 일련의 과정을 하나의 단위로 처리합니다. (예: load exclusive, store exclusive, CAS 등)

### Synchronization

![synchronized1](/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/synchronized1.png)

주파수가 같더라도 서로 다른 클럭 소스(Crystal)를 사용하는 경우 비동기(Asynchronous) 상태가 됩니다. 이 경우 전압 레벨이 불안정하게 지속되는 **메타스테빌리티(Metastability)** 현상이 발생할 수 있습니다. 이는 **Multi-flip-flop synchronization**을 통해 해결합니다.

---

이후 내용에서는 BFM(Bus Functional Model)을 활용하여 IP를 설계하고 검증하기 위한 방법론을 다룰 예정입니다. **BFM**을 이해하기 위해서는 우선 **Test-bench**에 대한 이해가 필요합니다.

## Test-bench

![testBench2](/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/testBench2.png)

**DUV(Design Under Verification)** 또는 **DUT(Design Under Test)** 는 검증 대상인 RTL 블록을 의미합니다. **Test-bench** 는 DUV가 제대로 작동하는지 확인하기 위해 입력을 넣어주고 결과를 비교하는 전체 환경을 의미합니다.

**Coverage**는 테스트가 DUV의 기능을 얼마나 커버했는지를 나타냅니다. 많은 기업에서는 코드 커버리지를 높게 유지하며 개발하는 것을 중요하게 여깁니다. 하지만 예상 출력(Expected output)을 매번 하드코딩하는 것은 매우 어려운 일입니다.

<div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
  <img src="/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/testBench3.png" alt="testbench3" width="300" height="200">
  <img src="/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/testBench4.png" alt="testbench4" width="300" height="200">
</div>

예상 출력을 직접 만들기 어려운 경우 **Golden model**을 정의하여 정답을 생성합니다. 또한 알고리즘 검증을 위해 **Reference model**을 추가하기도 합니다.

- **Golden model**: 전체적인 정답지 역할 (건축 조감도)
- **DUV**: 실제 구현 도면 (시공 설계 도면)
- **Reference model**: 수학적 정확성 검증 (구조 계산서)

Golden model은 DUV와 비교하며 문제를 해결하는 기준이 됩니다. Reference model은 주로 실수(Floating Point) 연산이 가능한 언어로 작성되어 알고리즘 결과를 재검증합니다.

## What is BFM?

![BFM1](/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/BFM1.png)

그림 (a)와 같은 구조는 검증이 쉽지만, 설계한 블록이 버스에 연결되는 형태라면 (b)와 같은 구조를 갖게 됩니다. 버스는 프로세서에 의해 제어되므로 이를 테스트하려면 주변 환경(Process, Bus, Memory)을 모두 설계해야 하는데, 이는 너무 복잡해집니다.

그래서 버스를 통한 입출력 동작을 행위 수준에서 모델링한 것이 **BFM(Bus Functional Model)** 입니다.

![BFM2](/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/BFM2.png)

위 그림은 전체적인 작동 구조입니다. AHB를 AXI로 바꾸더라도 기본적인 검증 구조는 동일합니다.

### Usages of BFM

![usage_of_bfm1](/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/usage_of_bfm1.png)

버스를 통해 만들어지는 주요 동작은 Read와 Write입니다. 그림 (b)와 같이 Task를 조합하여 시나리오를 만들거나, 그림 (c)처럼 Bus Command를 만들어 핸들링할 수도 있습니다. 여기서는 가장 기본적인 BFM 형태로 설계를 진행하겠습니다.

![usage_of_bfm2](/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/usage_of_bfm2.png)

예를 들어 SoC용 메모리 컨트롤러(IP)를 설계할 때, **axi_bfm**을 사용하여 **AMBA AXI** 프로토콜이 제대로 작동하는지 검증해야 합니다.

![bus_operation](/assets/post/2025-09-22-AMBA-AXI-Interface-Protocol/bus_operation.png)

결국 버스 프로토콜과 메모리 동작 사이에서 신호를 적절히 변환해 주는 것이 **Controller**의 핵심 역할입니다.