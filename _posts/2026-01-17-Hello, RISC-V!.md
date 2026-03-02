---
title: Hello, RISC-V!
description: This post covers my RISC-V study notes and personal insights
date: 2026-01-17
categories:
  - Learn
  - Personal
tags:
  - ComputerArchitecture
pin: true
math: true
author: ch
---
##  Introduce

2000년대 초반까지는 하드웨어가 알아서 빨라지던 시대였습니다. 단일 코어 성능이 매년 비약적으로 늘어난 덕분에 소프트웨어 개발자들은 굳이 최적화에 목을 매지 않아도 성능 향상의 이점을 누릴 수 있었습니다.

하지만 2003년경, 발열과 전력 소모, 그리고 ILP(명령어 수준 병렬성)가 한계에 부딪히며 이러한 흐름은 정체되었습니다. 제조사들은 클럭 주파수를 높이는 대신 멀티코어로 선회했고, 이때부터 성능을 제대로 뽑아내기 위해 병렬 프로그래밍과 컴퓨터 구조에 대한 깊은 이해는 필수 역량이 되었습니다.

**그렇다면 왜 수많은 아키텍처 중 하필 RISC-V일까요?**

일단 X86-64는 제외했습니다. micro operation이 있다곤 하지만 시작부터 너무 비대한 아키텍쳐를 공부하면 제대로 소화하지 못할 것 같았습니다.

RISC 기반 아키텍처는 원리적인 면에서는 비슷비슷합니다. 그렇지만 저는 굳이 복잡한 상업적 제약이 걸린 폐쇄적인 아키텍처를 붙잡고 씨름하고 싶지 않았습니다. 특히 RTL 레벨의 설계 경험이 있는 입장에서, 가장 밑바닥까지 투명하게 파고들 수 있는 RISC-V를 선택하는 것이 기본기를 다지기 가장 좋은 길이라 판단했습니다.

또한, Inference Performance에 관심이 많은 저에게 특수 목적 가속기에서 RISC-V가 보여주는 성장세가 매력적으로 다가왔습니다. 물론 산업계 전체로 보면 ARM의 점유율에 비해 RISC-V의 점유율은 여전히 저조합니다. 그렇지만 특수 목적 가속기에서까지 ARM에 로얄티를 내면서 만들지 않을 것 같..... 아무튼 RISC-V 화이팅!!!

![single cycle](/assets/post/2026-01-17-Hello,-RISC-V!/spongeBob_meme.jpg)
## Processor
### Single Cycle

![single cycle](/assets/post/2026-01-17-Hello,-RISC-V!/singleCycle.png)
시간별로 한 모듈밖에 돌아가지 않아 굉장히 오래 걸립니다. 단일 사이클 설계를 쉽게 보여주는 예시입니다.

단일 사이클 설계은 참으로 비효율적인 녀석입니다. CPU는 BCLK를 기반으로 내부 클록을 생성하여 작동하는데, 단일 사이클 방식은 한 클록 안에 명령어의 전 과정($IF \rightarrow WB$)을 모두 마쳐야 합니다. 결국 전체 시스템의 클록 주기($T_c$)를 가장 지연 시간이 긴 명령어인 `lw`의 critical path에 맞춰야만 합니다.

이는 컴퓨터 아키텍처의 황금률 '자주 발생하는 케이스를 빠르게 처리하라' 원칙에 정면으로 위배됩니다. 가벼운 `add` 연산조차 무거운 `lw`가 앞에 있으면 끝날 때까지 기다려야 하기 때문이죠. 그래서 현대 프로세서에서는 단계마다 데이터를 유지?(Latch)하며 격리하는 파이프라이닝(Pipelining)을 통해 클록 주기를 극단적으로 끌어올려 사용합니다.

### Pipelining

![R-Type-datapath](/assets/post/2026-01-17-Hello,-RISC-V!/pipelining.png)
아주 효율적이죠? 모든 부품들이 쉴 새 없이 돌아갑니다.

파이프라이닝은 파이프라인 레지스터를 경계로 명령어 실행 단계를 여러 단계로 분할하는 설계 기법입니다. 각 단계 사이에 벽(Pipeline Register)을 세워 데이터 흐름을 격리함으로써, 하나의 명령어가 끝나기 전이라도 다음 명령어를 즉시 투입하여 하드웨어 자원이 쉬지 않고 가동되게 합니다.

이는 전체 Critical Path를 짧게 쪼개기 때문에 클록 주기를 획기적으로 단축할 수 있으며, 결과적으로 Throughput을 극대화하여 단일 사이클 설계의 구조적 비효율을 해결합니다.

하지만 여러 명령어가 동시에 실행되는 특성상 앞뒤 명령어 간의 간섭으로 인해 실행이 지연되는 장애물이 발생하는데 이를 `Hazard`라고 하며, `Structure Hazard`, `Data Hazard`, `Control Hazard`로 분류됩니다.

{: .prompt-tip}
>**💡RISC-V의 3가지 핵심 장점**
>
>**1. 명령어 길이의 규칙성:** 모든 기본 RISC-V 명령어는 4바이트로 고정되어 있습니다. 명령어의 경계가 명확하기 때문에 하드웨어가 IF(Instruction Fetch)와 ID(Instruction Decoding) 단계를 훨씬 단순하고 빠르게 처리할 수 있습니다.
>
> **2. 필드 위치의 일관성:** 명령어 형식의 종류가 적을 뿐만 아니라, 첫번째 소스 레지스터(`rs1`)와 목적 레지스터(`rd`)의 위치가 항상 고정되어 있습니다. 덕분에 제어 장치가 명령어를 완전히 해독하기도 전에 미리 레지스터 값을 읽어올 수 있어 성능이 최적화됩니다.
> 
>**3. 연산과 메모리 접근의 철저한 분리:** RISC-V는 모든 연산은 레지스터에서만 수행하고, 메모리 접근은 `Load/Store` 명령어로 격리합니다. 이를 통해 값비싼 메모리 지연이 시스템 성능을 저하시키는 것을 방지합니다.

{: .prompt-info}
>x86-64 아키텍처는 가변길이 명령어의 고질적인 Decoding 병목&전력 소모를 해결하기 위해, 한 번 변환된 명령어 조각들을 `μOps Cache`에 저장합니다. 이는 파이프라이닝, 비순차 실행(OoOE, Out of Order Execution), 슈퍼스칼라 구조를 RISC-V와 유사한 수준의 효율로 구현할 수 있게 만들어주지만 `μOps`에서 발생하는 물리적인 전력 낭비와 추가적인 Latency 문제에서 자유롭지 못하고, 이 점은 x86 아키텍쳐 대비 RISC 아키텍쳐가 가지는 매우 중요한 장점입니다.

### Structural Hazard

`Structural Hazard`는 하드웨어 자원(Resource)의 종속성으로 인해 발생합니다. 서로 다른 두 명령어가 동시에 하드웨어 부품을 사용하려고 할 때 발생하죠. 그런데 RISC-V ISA가 처음부터 파이프라이닝을 위해 설계한 것이기 때문에 `Structural Hazard`는 다른 Hazard에 비해 비교적 피하기 어렵지 않습니다. 

### Data Hazard

파이프라이닝은 여러 명령어를 겹쳐서 실행하기 때문에, 논리적인 실행 순서와 물리적인 데이터 완성 시점 사이에 괴리가 생기기 쉽습니다. `Data Hazard`는 파이프라인에서 앞선 명령어의 결과값이 아직 준비되지 않았음에도 불구하고, 다음 명령어가 해당 값을 사용하려 할 때 발생하는 데이터 종속성 문제입니다.

`Data Hazard`의 해결 구조는 크게 두 가지 파트로 나누어 보면 이해하기 쉽습니다. 첫째는 데이터 경로를 틀어주는 `Forwarding Unit`이고, 둘째는 데이터가 준비되지 않아 Forwarding만으로는 해결할 수 없을 때(Load-Use, 메모리에서 레지스터로 데이터를 복사하기 전 해당 레지스터를 사용하려고 시도하는 경우) `nop`을 삽입하여 `Stall`을 거는 `Hazard Detection Unit`입니다

#### Forwarding

`Fowarding`은 앞선 명령어에서 ALU - 레지스터/메모리 구간에 있는 데이터를 조금 빨리 땡겨쓰는 기법입니다. 정확히 아래의 조건을 만족하는 경우 `Fowarding Unit`이 동작합니다.

>**Fowarding 의 동작 조건**
>- EX/MEM.RegisterRd = ID/EX.RegisterRs1
>- EX/MEM.RegisterRd = ID/EX.RegisterRs2
>- MEM/WB.RegisterRd = ID/EX.RegisterRs1
>- MEM/WB.RegisterRd = ID/EX.RegisterRs2

{: .prompt-info}
>RegisterRd: ALU 출력 값을 기록할 레지스터의 번호 (5비트 주소, 0~31)
>
>RegisterRs: ALU에 입력값으로 넣어줄 데이터가 저장된 레지스터의 번호 (5비트 주소, 0~31)


그런데 여기 `MEM` 단계나 `WB` 단계의 `Destination 레지스터`가 현재 `ALU` 단계의 `Source 레지스터`와 동일한 경우  이중 연산을 막기 위해 `WB`단계의 `Destination 레지스터`를 무시하고 `MEM`단계의 `Destination 레지스터`를 `Source 레지스터`로 넣어야합니다. 해당 로직을 포함하여 `Fowarding` 로직을 코드로 구현하면 아래와 같습니다.

*EX Hazard*
```
if (EX/MEM.RegWrite
and (EX/MEM.RegisterRd != 0)
and (EX/MEM.RegisterRd = ID/EX.RegisterRs1)) FowardA = 01

if (EX/MEM.RegWrite
and (EX/MEM.RegisterRd != 0)
and (EX/MEM.RegisterRd = ID/EX.RegisterRs2)) FowardB = 01
```

*MEM Hazard*
```diff

+++ 중첩 Fowarding을 막기 위해 전전 결과는 무시하고, 전 결과를 Fowarding하는 제어문

if (MEM/WB.RegWrite
and (MEM/WB.RegisterRd != 0)
+and not (EX/MEM.RegWrite and (EX/MEM.RegisterRd != 0)
+    and (EX/MEM.RegisterRd = ID/EX.RegisterRs1))
and (MEM/WB.RegisterRd = ID/EX.RegisterRs1)) FowardA = 01

if (MEM/WB.RegWrite
and (MEM/WB.RegisterRd != 0)
+and not (EX/MEM.RegWrite and (EX/MEM.RegisterRd != 0)
+    and (EX/MEM.RegisterRd = ID/EX.RegisterRs2))
and (MEM/WB.RegisterRd = ID/EX.RegisterRs2)) FowardB = 01
```

데이터가 메모리에서 나오는 시점(MEM)이 다음 명령어가 실행하려는 시점(EX보다 늦기 때문에 Load-use data hazard가 발생합니다.

#### Hazard Detection

앞에서 간단하게 설명했지만, `Fowarding Unit`이 해결 못하는 경우 중 하나가 `Load`명령어를 뒤따르는 명령어가 `Load`명령어에서 쓰기를 행하는 레지스터를 읽으려고 시도하는 경우입니다. 

![Data Fowarding with load-use data hazard](/assets/post/2026-01-17-Hello,-RISC-V!/Load-use_data_hazard.png)

위 그림에서 `CC 4`에서 `Load`명령어가 데이터를 읽고 있는데 `ALU`는 이미 그 다음 명령어를 위한 연산을 수행하고 있죠. 따라서 적재 명령어 뒤에 이 결과값을 읽는 명령어가 뒤따라 나오면 누군가가 파이프라인을 `Stall(지연)`시켜야 합니다.

그래서 `Fowarding Unit`외에 `Hazard Detection Unit`이 필요합니다. 이 유닛은 ID 단계에서 동작하며 적재 명령어와 결과값 사용 명령어 사이에 지여을 추가할 수 있도록 돕죠. 적재 명령어만 검사하면 되므로 `Hazaed Detection Unit`에 대한 제어는 아래와 같은 단 한가지 조건을 가집니다.

*Hazaed Detection Unit*
```
if (ID/EX.MemRead and
	((ID/EX.RegisterRd = IF/ID.RegisterRs1) or
	(ID/EX.RegisterRd = IF/ID.RegisterRs2)))
	stall the pipeline
```
위 `Hazard Detection Unit`은 `CC 3`에 작동하며 조건이 만족되면 명령어는 1 clock cycle만큼 지연됩니다. 1 clock cycle stall 후에는 `Fowarding Unit`이 종속성을 처리할 수 있어 실행은 계속 진행되며, 만약 `Fowarding Unit`이 없으면 1Cycle 더 Stall됩니다.

위 로직을 적용한 Data Hazard는 아래 그림과 같게 됩니다.

![Multieple clock cycle pipeline diagrams](/assets/post/2026-01-17-Hello,-RISC-V!/data_hazard_single_clock_cycle_pipeline_diagrams.png)
### Control Hazard

{: .prompt-info}
>Data Hazard만큼 자주 일어나지 않지만, Data Hazard의 Fowarding 같은 완벽한 해결책이 없기 때문에 더 복잡해질 수 있습니다.

파이프라인이 계속 일하기 위해서는 매 클럭마다 명령어가 `fetch`되어야 하는데, 지금의 설계대로라면 `branch`에 대한 결정이 `MEM`단계에 이루어집니다. 이렇게 `fetch`할 명령어를 결정하는 일이 늦어지는 현상을 `Control Hazard`라고 합니다.

{: .prompt-info}
>파이프라인이 길어지고 Superscalar 실행에 Dynamic Branch Prediction이 적용되면서 지연 분기는 없어도 그만이 되어버렸습니다.

#### Always Taken(Static Branch Prediction)

분기가 일어나지 않는다고 가정하고, 일어나면 이전에 발생했던 `IF`, `ID`. `EX`를 `Flush`해버리는 방식입니다. `Load-Use Data Hazard`의 경우처럼 기존 제어값을 0으로 바꾸면 되는데, 버려야 하는 명령어가 1개에서 3개로 바뀐 점이 다릅니다.

분기가 일어날 확률이 절반 정도 되고 명령어를 버리는 비용이 거의 없다면 이 최적화 방법은 `Control Hazard`의 비용을 절반으로 줄입니다.

그러나 파이프라인이 깊어질수록 `branch`손실이 증가하고, 현대 프로세서에서 표준이 된 `Superscalar`방식에서 큰 복잡성을 만들고 `branch`손실을 증가시킬 수 있습니다.  
####  Dynamic Branch Prediction

{: .prompt-tip}
>90년대 초에는 dynamic branch predicton이 너무 많은 자원을 차지하여 고성능 컴퓨터에서도 쓰이지 않았습니다. 그러나 트랜지스터 수가 계속 증가되고  논리 회로가 메모리보다 훨씬 더 빨라지면서 Multiple Functional Unit을 칩 안에 더 때려박을 수 있게되었고 결과적으로 Multiple Issue와 Dynamic Branch Prediction을 사용할 수 있게 되었죠

코어 내부에 `SRAM`기반 `Branch Prediction Buff`구성하여 만들어 이 명령어가 이전에 `branch`여부를 조사합니다. **1Bit Prediction** 은 연속된 `branch`속에서 한 번 `branch`하지 않으면 2번 예측에 실패하는 단점이 있는데, 이 같은 약점을 보완하기 위해 두번 연속 예측에 실패해야 Buffer Data가 바뀌는 **2Bit Prediction**이 있습니다.

이 외에도 Correlating Predictor, Tournament Predictor가 있는데.. 프로세서의 성격에 맞춰서 사용됩니다.

{: .prompt-tip}
>위 방식대로 진행할 경우, 분기 목적지 계산에 1 Cycle이 사용되는데, 이는 BTB를 사용하여 해결할 수 있습니다.

{: .prompt-tip}
>RISC-V에서는 `Conditional Branch` 명령어를 줄이는 방법으로 `Conditional Move`명령어를 사용하는 방법도 있습니다. `move`명령어는 `rs1`, `rs2`, `rd`로 이루어지는데, Buffer를 확인하고 ID/EX.registerRd를 중간에 변경해버리는 방식으로 구현됩니다.  그러나 해당 방식의 ISA를 사용하려면 Zicond(Custom Extension: Conditional Operations)를 추가하거나, 직접 손을 봐야합니다.

### Exception

제어에서 가장 어려운 부분이 `Exception/Interrupt` 구현이라고 합니다. 실제로는 아래 표와 같이 굉장히 다양한 예외가 존재하는데요, 포스팅에서는 정의 안된 명령어의 실행과 하드웨어의 오작동으로 발생하는 예외만 다루겠습니다.

그리고 포스팅에서는 원인이 내부에 있건 외부에 있건 구별 없이 제어 흐름에서의 예기치 못한 변화를 지칭할 때 `Exception`이라 지칭하고, 사건이 외부적인 요인으로 일어날 경우에만 `Interrupt`용어를 사용하겠습니다.

| **분류 (명칭)**                            | **발생 원인 (Trigger)**                                                 | **대표적인 실제 사례**                                           |
| -------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------- |
| **Interrupt**<br>(Timer Interrupt)     | `mtime` 레지스터 값이 `mtimecmp` 값보다<br>크거나 같을 때                          | OS 스케줄러가 멀티태스킹을 위해 현재<br>프로세스를 중단하고 Context Switch 하는 경우 |
| **Interrupt**<br>(External Interrupt)  | `PLIC(Platform-Level Interrupt Controller)`<br>를 통해 외부 장치 신호가 들어올 때 | 키보드 입력, 네트워크 패킷 도착 등<br>주변 장치가 처리를 요청할 때                 |
| **Exception**<br>(Environment Call)    | `ECALL` 명령어 실행                                                      | 사용자 프로그램이 OS 커널(시스템 콜)을<br>호출할 때                         |
| **Exception**<br>(Page Fault)          | 가상 메모리 변환(Virtual Address Translation)<br>실패 또는 권한 위반 시             | 메모리에 로드되지 않은 페이지에 접근하거나<br>(Swap) 읽기 전용 페이지에 쓰기를 시도할 때   |
| **Exception**<br>(Illegal Instruction) | 디코더가 알 수 없는 Opcode를 만났거나,<br>권한 없는 `CSR`에 접근할 때                     | 지원하지 않는 확장 명령어를 실행하거나,<br>손상된 바이너리를 실행할 때                |

CPU가 `Exception`이나 `Interrupt`를 감지하면, 하드웨어 레벨에서 즉시 문제가 발생한 명령어의 주소를 `sepc(Supervisor Exception Program Counter)` 레지스터에 저장하고, 그 원인을 `scause(Supervisor Exception Cause)` 레지스터에 원인을 기록합니다.

![privilege mode](/assets/post/2026-01-17-Hello,-RISC-V!/privilege_mode.png)

그리고 CPU는 현재 `Privilege` 를 `U-Mode(User Mode)`에서 `S-Mode(Supervisor Mode)`로 변경함과 동시에, `stvec` 값을 보고 `PC`를 변경합니다.

$$\text{stvec} = [\quad \text{BASE (Address: 30bit)} \quad ] \quad [\ \text{MODE (2bit)}\ ]$$

{: .prompt-tip}
>- **stvec Mode 0:** `Base Mode`
>   
>   $$\text{New PC} = (\text{stvec} \ \& \ \text{0xFFFFFFFC})$$
>- **stvec Mode 1:** `Vectored Interrupt Mode`
>  
>$$\text{New PC} = (\text{stvec} \ \& \ \text{0xFFFFFFFC}) + (\text{SCAUSE.Exception Code} \times 4)$$

그러면 `PC`에 따른 `OS trap handler`가 실행되고, `OS`는 역할을 다한 뒤 `sret` 명령어를 실행합니다. 이때 하드웨어는 `SEPC` 값을 `PC`로 복구함과 동시에, 저장해뒀던 이전 상태를 확인하여 `Privilege`를 다시 `U-Mode`로 변경해줍니다

{: .prompt-info}
>이 과정에서 함수는 반드시 4 byte로 정렬(Alignment) 되어야 합니다(aligned(4)). 이는 `stvec`가 하위 2비트를 `Mode Flag`로 사용하기 때문입니다.

![datapath_with_controls_to_handle_exceptions](/assets/post/2026-01-17-Hello,-RISC-V!/datapath_with_controls_to_handle_exceptions.png)

`Exception`을 고려한 `pipelined datapath`은 위와 같습니다. 사실 기능적으로는 `Load-Use`와 거의 동일합니다.

{: .prompt-info}
> 기능적으로 동일함에도 `MUX`에 제어선을 추가로 연결하지 않은 이유는 제어 신호의 bit width만큼 `MUX`를 확장하는 것보다 `OR Gate`를 추가하는 것이 비용적인 측면에서 훨씬 저렴하기 때문입니다.

### Parallelism

파이프라이닝은 명령어들 사이에 병렬성을 이용하며 이를 `ILP(Instruction-Level Parallelism)`라고 합니다.

`ILP` 양을 증가시키는 방법은 다음과 같습니다.

1. 파이프라인의 깊이를 중가시키기
2. Multiple Issue

`Multiple Issue`는`Static Multiple Issue`와 `Dynamic Multiple Issue`로 구분되며 아래 두가지 기본적인 문제를 해결해야 합니다.

1. **`Issue Slot`:** 프로세서의 적정  `IPC`와 어떤 명령어들을 내보낼 것인가
2. **`Data/Control Hazard`:**  `Hazard`를 어떻게 제어할 것인가

#### Static Multiple Issue - VLIW(Very Long Instruction Word)

`Static Multiple Issue` 프로세서의 핵심은 하드웨어가 하던 명령어 종속성 판단을 컴파일러가 대신 처리하는 것입니다. 컴파일러는 실행 시점에 충돌이 없는 명령어들을 미리 골라 하나의 묶음으로 만드는데, 이를 `Issue Packet`이라고 부릅니다.

VLIW(Very Long Instruction Word)는 이러한 방식을 극대화한 구조입니다. 하드웨어에서 복잡한 스케줄링 회로를 제거해 전력 효율과 칩 면적을 최적화할 수 있다는 강력한 장점이 있습니다.

하지만 이론적인 최대 성능을 내기 위해서는 컴파일러가 빈 `Issue slot` 없이 패킷을 꽉 채워야 하므로, 실질 IPC(클럭당 명령어 처리 수)가 전적으로 컴파일러의 역량에 의존하게 됩니다. `VLIW`구조는 컴파일러가 올바르게 스케줄링 하지 않으면 슬롯에 `nop`이 채워지며 낭비를 야기합니다.  이러한 구조적 경직성과 하드웨어 세대 간의 호환성 문제로 인해, VLIW는 범용 컴퓨터보다는 특정 계산 특화된 프로세서에 주로 사용됩니다.

#### Dynamic Multiple Issue - Superscalar

`Superscalar`는 `Issue Packed`하지 않고 명령어를 순차적으로 내보내며, 컴파일러의 스케줄 여부와 관계 없이 하드웨어에 의해 올바르게 실행되도록 보장받습니다. 이러한 특징으로 인해 `VLIW`와 다르게 다른 프로세서에서 실행할 때 재컴파일이 필요 없다는 장점이 있습니다.

많은 superscalar 프로세서는 Multiple Issue를 결정하는 기본 틀을 확장하여 Dynamic Pipeline scheduling을 구성합니다. Dynamic Pipeline scheduling은 매 클럭 사이클마다 `Hazard`로 인한 지연을 최소화할 수 있는 명령어들을 실시간으로 선택하며, 그 과정에서 지연을 피하기 위해 명령어들을 재정렬하기도 합니다.

![Multieple clock cycle pipeline diagrams](/assets/post/2026-01-17-Hello,-RISC-V!/dynamic_scheduling_pipeline_units.png)
이러한 프로세서의 파이프라인은 `Instruction Fetch and Decode Unit`, `Multiple Functional Units`, 그리고 `Commit Unit` 세 가지 주요 부분으로 구성됩니다.

해독된 명령어는 Reservation Station(RS) 버퍼에 저장되며, 이때 데이터는 Opcode, Operand의 값(V field) 또는 태그(Q field), 그리고 목적지 정보(rd) 등으로 구성됩니다. 이 과정에서 실제 레지스터 번호 대신 RS의 태그를 사용하여, 실제 데이터와 상관없이 레지스터 이름이 겹쳐 발생하는 가짜 종속성(WAR, WAW)을 제거합니다.

Functional Unit에서 비순차적으로 계산이 완료되면, 결과값은 ROB(Reorder Buffer)에 임시 저장됩니다. 이후 ROB는 정적 스케줄링의 Forwarding과 유사하게, 해당 결과를 기다리는 다른 명령어들에 데이터를 즉시 제공함과 동시에 최종적으로 결과를 순차적으로 Commit합니다.

{: .prompt-info}
>RS를 통한 Operand 버퍼링과 ROB를 통한 결과값 임시 저장은 가짜 종속성을 해결하여 비순차실행을 가능케 하는 Register Renaming의 대표적 구현 방식입니다. 컴파일러의 Loop Unrolling 역시 소프트웨어 단에서 이름을 분산시켜 종속성을 끊어내는 점에서 Register Renaming에 속하게 됩니다.

{: .prompt-info}
>RAW의 경우 데이터가 필요한 진종속성이므로 레지스터 재명명으로 해결 불가능하고 `Data Fowarding`이나 `Stall`로 해결해야 합니다.

## Memory Hierarchy

메모리 계층 구조는 제한된 비용 내에서, 사용자에게 가장 빠른 메모리의 접근 속도와 충분한 용량을 동시에 제공하는 것을 목표로 합니다.

그러한 최적화를 위한 모든 기술에는 지역성의 원칙이 적용됩니다.

1. **시간적 지역성(Temporal Locality) :** 한번 참조된 항목은 곧바로 다시 참조되는 경향
2. **공간적 지역성(Spatial Locality) :** 어떤 항목이 참조되면 그 근처에 있는 다른 항목들이 곧바로 참조될 가능성이 높다

프로그램에서의 지역성은 단순하고도 자연스러운 프로그램 구조에서 나오는데요, 순환문과 순차접근에서 이와 같은 특성을 볼 수 있습니다. 이러한 특성들을 잘 살려 성능을 최적화 하기 위해 현대 메모리 시스템은 Hierarchy(계층구조)를 사용합니다.

메모리 계층구조는 여러 계층으로 구성되지만, 데이터는 인접한 두 계층 사이에서만 한 번에 복사됩니다. 이 두 계층 간 정보 전송의 최소 단위를 **Block/Line**이라고 부릅니다. 그리고 프로세서가 요구한 데이터가 상위 계층의 어떤 블록에 있을 때 이를 **Hit** 이라고 부릅니다. 그리고 상위 계층에서 찾을 수 없다면 **Miss**라고 부르죠. 위 표현들은 자주 사용되니 반드시 알고있어야 합니다. 

### Cache Architecture

#### SRAM

하드웨어의 물리적 구현 방식에 대해서 꼭 알아야 하는 것은 아니지만, 알아두면 참 좋습니다. 캐시 아키텍처의 대부분을 담당하는 SRAM의 Memory chip 구조는 아래와 같습니다.


![memory_chipt_structure](/assets/post/2026-01-17-Hello,-RISC-V!/memory_chipt_structure.png)
위 그림에서와 같이, RAM(Random Acess Memory)은 WL과 BL을 통해 원하는 주소값에 해당하는 Cell에 접근할 수 있습니다. 

Word Line(WL)과 Bit Line(BL)이 교차 인가되는 Selected Cell에서 저장하는 Bit 크기 에 따라 SLC(Single Level Cell), MLC(Multie Level Cell)로 구분할 수 있는데, 본 포스팅에서는 SRAM이 SLC라고 가정하겠습니다.

![SRAM_cell](/assets/post/2026-01-17-Hello,-RISC-V!/6transistor_cmos_sram_cell.jpg)

먼저 SRAM에 대해 쉽게 이해해보자면 `INV` 두개가 맞물린 구조입니다. `Q`라는 노드에 `0`이 저장되어있으면 `INV`를 통해 `/Q`의 값은 `1`로 계속해서 유지됩니다. 따라서 `Q`와 `/Q`의 순환에 의해 데이터가 바뀌지 않고 안정적으로 유지되죠. 전력이 공급되는 한 신호의 입력 논리가 유지되는 성질로 인해 전하 누출로 인한  `refresh`가 필요하지 않기 때문에 Static RAM이라고 불립니다.

#### Basic of Cash - Direct Mapped

Cache는 Byte 보다 큰 `chunk`인 `block` 단위로 접근합니다. 실제로 Cache Block은 `4~8 word`로 구성되며 프로세서도 한번에 `4~8 word`를 필요로 하지만, 본 목차에서는 프로세서가 한 순간 필요로 하는 데이터는 `1 word`이고, `block` 또한 `1 word`로 이루어진 아주 단순한 캐시로 가정하고 설명을 진행합니다.

캐시 시나리오에서는 아래 두가지 의문이 필요합니다.

1. 데이터가 캐시내에 있는지 어떻게 알 수 있는가?
2. 알 수 있다면 어떻게 찾을 수 있는가?

만약 각 `word`가 캐시 내의 딱 한 장소에만 있을 수 있다면 `word`가 캐시 내에 있는지 없는지를 바로 알 수 있습니다. 각 메모리 워드에 캐시 내의 위치를 할당하는 가장 간단한 방법은 그 워드의 메모리 주소를 이용하는 것으로, 이러한 캐시 구조를 메모리 위치가 캐시 내의 딱 한 장소로 Mapped되기 때문에 **`Direct Mapped`** 이라고 부릅니다.

![Direct Mapped](/assets/post/2026-01-17-Hello,-RISC-V!/direct_mapped.png)

그리고 거의 모든 `Direct Mapped Cache`는 아래의 Mapped 방식으로 Cache Block을 찾습니다.

$$\text{Cache Index} = \text{Block Address} \pmod{\text{Number of Cache Blocks}}$$

이러한 방식으로 매핑할 경우 서로 다른 메모리 주소들이 하나의 Cache Index를 공유하게 되어, 특정 시점에 캐시에 들어있는 주소가 내가 찾는 주소인지 확인할 길이 없습니다. 따라서 `tag field`에 MOD 연산으로 생략된 상위 비트를 기록하여 주소를 식별합니다.

컴퓨터 부팅 직후나 SRAM 초기화 시점에는 캐시 내부에 의미 없는 쓰레기 값이 저장되어 있습니다. 이때 `valid bit`가 없다면, 초기화 직후 캐시 접근 시 쓰레기 값을 유효한 데이터로 오인하는 `False Hit`이 발생하거나, 잘못된 태그 비교로 인해 불필요한 메모리 접근이 발생하게 됩니다. 따라서 `valid bit`를 통해 해당 라인의 데이터가 실제로 유효한지 확인하는 과정이 반드시 필요합니다.

{: .prompt-info}
>특정 패턴의 주소(예: 하위 비트가 항상 001인 주소)만 반복해서 사용한다면 캐시의 다른 공간(000, 010 등)이 비게 되는 것은 Direct Mapped의 Conflict Miss 문제이므로 어쩔 수 없습니다.

![Direct Mapped](/assets/post/2026-01-17-Hello,-RISC-V!/miss_rate_vs_block_size.png)

블록이 크면 공간적 지역성을 더 잘 활용해서 실패율이 낮아집니다. 위 그림에서 보인 것처럼 Block Size를 늘리면 대개 Miss rate이 줄어들죠. 하지만 Block Size가 너무 커서 블록 하나가 캐시의 상당 부분을 차지하게 되면 캐시 내의 블록 개수가 너무 적어 블록에 대한 경쟁이 심해지기 때문에 실패율이 오히려 커질 수 있습니다. 그런데 이보다 더 심각한 문제는 Miss Penalty의 증가입니다.

 $$\text{Miss Penalty} = \text{Acess Latency} + \text{Tranfer Time}$$

Miss Penayty는 메모리 계층구조의 다음 하위 계층에서 블록을 가져와서 캐시에 적재하는 데 걸리는 시간에 의해 결정됩니다. 그런데 메모리 시스템이 바뀌지 않는 한 블록 크기가 늘어나면 늘어날수록 Transfer Time에 따라서 Miss Rate이 증가합니다. 결과적으로 블록이 너무 커지면 Miss Penalty의 증가가 Miss rate reduction을 압도하게 되고 캐시 성능이 감소하는 것이죠.

{: .prompt-tip}
>물론 큰 블록을 보다 효율적으로 전송할 수 있게 메모리를 설계한다면 블록의 크기를 크게 할 수 있고 캐시의 성능 또한 더 개선할 수 있습니다.


### Optimizing Cache Performance

지금까지는 메모리 블록을 캐시에 넣을 때 각 블록이 캐시의 딱 한 곳에만 들어갈 수 있는 단순한 `Direct Mapped` 방법을 사용했습니다. 하지만 실제로는 블록을 배치하는 다양한 방식이 존재하는데, 그 중 중요한 방식이 `Set Associati-ve(집합 연관)`방식입니다.

#### Set Associative

{: .prompt-tip}
>사실 모든 블록 배치 방식은 `Associativity`구조의 변형입니다. `Direct Mapped`는 `1-way Associative`이고, `Fully Associative`는 `N(cash size)-way Associative`방식이니까요.

![Direct Mapped](/assets/post/2026-01-17-Hello,-RISC-V!/4-way_set_associative.png)

위 방식은 가장 기본적인 형태로 구현한 `4-way set associative`입니다. 4개의 원소 중 하나를 선택해야하기 때문에 4:1 Mux와 4개의 comparator가 필요합니다. 결국 아키텍쳐 설계자는 추가로 필요한 Comparator의 비용과 집합의 원소들을 비교/선택하는 데 걸리는 시간 지연을 고려하여 최선의 선택을 내려야합니다.

그리고 `Set Associative`방식에서는 집합에서 교체할 블록을 선택하는 과정에서 어떤 블록을 선택할 것인지 교칙이 필요합니다.이 중 가장 널리 사용되는건 `LRU(Least Recently Used)`방식으로 가장 오랫동안 사용되지 않는 블록을 교체하는 방식이죠.

{: .prompt-tip}
>캐시의 연관성(Associativity)이 높아질수록 엄격한 `LRU(Least Recently Used)` 알고리즘을 하드웨어로 구현하는 데 따르는 비용과 복잡성이 급격히 증가합니다. 이러한 제약을 극복하기 위해 구현이 상대적으로 간편한 `randomized marking algorithm`이 대안으로 사용되기도 합니다.
>
>이 알고리즘은 캐시 크기가 충분히 커질 경우 캐시 실패율이 `LRU`와 근사한 수준으로 수렴하면서도, 하드웨어 구현 비용은 훨씬 저렴하다는 장점이 있습니다. 다만 Virtual Memory와 같이 Page Fault의 비용이 극심하여 아주 작은 실패율 감소조차 시스템 전체 성능에 결정적인 영향을 미치는 영역에서는 타협 없이 LRU 또는 그에 준하는 정밀한 알고리즘을 고수하는 경향을 보입니다.

#### Blocking

 Blocking Algorithm은 Matrix를 행과 열 단위로 처리하지 않고 subMatrix 또는 Block단위로 처리합니다. 캐시에 적재된 데이터가 교체되기 전에 최대한 뽕뽑고 버리자, 즉 시간적 지역성(Temporal Locality)를 향상시키는게 목표죠.

간단한 행열에서의 내적 구현을 한번 보겠습니다.


<div id="naive_matmul"></div>

<script src="/assets/js/2026-01-17-Hello,-RISC-V!/naive_matmul.js"></script>

위 방식은 naive한 DGEMM 구현입니다. 이와 같은 방식으로 진행하면 캐시의 시간적 지역성에서 큰 이점을 누리지 못합니다. 최악의 경우 $N^3$연산에서 $2N^3 + N^2$메모리 워드 접근이 발생합니다.

아래는 위에서 구현한 기능을 dgemm에 inline하고, blocking을 추가하여 시간적 지역성을 챙기려고 노력한 DGEMM 구현입니다.

```c
#define BLOCKSIZE 3

/*
 * do_block: Naive DGEMM Simulation 기능적으로 완전히 동일
*/
inline void do_block(int n, int si, int sj, int sk, double* A, double* B, double* C)
{
    for (int i = si; i < si + BLOCKSIZE; ++i)
        for (int j = sj; j < sj + BLOCKSIZE; ++j)
            double cij = C[i + j * n];
            for (int k = sk; k < sk + BLOCKSIZE; k++){
                // FMA (Fused Multiply-Add) 연산 수행
                cij += A[i + k * n] * B[k + j * n];
            } C[i + j * n] = cij;
}

/**
 * dgemm: 전체 행렬을 BLOCKSIZE 단위로 쪼개어 do_block 호출
*/
void dgemm(int n, double* A, double* B, double* C)
{
    for (int sj = 0; sj < n; sj += BLOCKSIZE)
        for (int si = 0; si < n; si += BLOCKSIZE)
            for (int sk = 0; sk < n; sk += BLOCKSIZE)
                // 작은 타일 단위로 연산을 위임하여 캐시 적중률(Cache Hit)을 극대화
                do_block(n, si, sj, sk, A, B, C);
}
```

<div id="tiling_matmul_visualization"></div>

<script src="/assets/js/2026-01-17-Hello,-RISC-V!/tiling_matmul.js"></script>

B 블록과 C블록에서 Cach Hit의 차이가 확연히 보이죠? 이러한 Blocing(same asTiling)기법을 사용하면 지역성을 높여 컴퓨팅 성능을 향상시킬 수 있습니다.

위 코드를 gcc Compiler를 통해 최적화 옵션을 적용하여 컴파일하면 Inline이 적용되며 do_block함수의 오버헤드가 제거됩니다. 그리고 Blocing을 통해 메모리 워드 수도$2N^3/BLOCKSIZE + N^2$로 감소하는 효과를 보여줍니다. 

A는 공간적 지역성에서 이점을 취하고 B는 시간적 지역성에서 이점을 취하므로, Blocking은 공간과 시간 지역성을 모두 이용하는 최적화 방식입니다. PC와 Matrix Size에 따라 달라지긴 하지만 Blociking시 2배에서 10배 이상까지의 성능 개선을 시킬 수 있다고 합니다.

{: .prompt-info}
>블로킹의 목적은 캐시 실패를 줄이는 것이지만 레지스터 할당을 돕는데 사용할 수도 있습니다. 블록이 레지스터에 들어갈 수 있을 만큼 BlockSize를 작게 하면 프로그램의 `Load/Store` 횟수를 줄일 수 있어 성능 향상을 만들어낼 수 있습니다. 


### System Virtual Machinie

virtual machine은 개발된지는 꽤나 오래됐습니다(1960년도). 1990년대만 하더라도 일반 PC시장에서는 거의 사용되지 않았지만 현대에 들어서며 프로세서 속도의 획기적인 발전으로 VM이 오버헤드를 더 감당할 수 있게 되고, 격리와 보안에 대한 중요도가 증가하며 인기를 얻고 있습니다.

![Direct Mapped](/assets/post/2026-01-17-Hello,-RISC-V!/virtual_machines.webp)

VM은 사실 꽤나 넓은 영역을 지니고있습니다.Java VM같이 표준 소프트웨어 인터페이스를 제공하는 모든 에뮬레이션 또한  VM으로 취급되는데요, 블로그에서 다루는 VM은 ISA수준에서 완전한 시스템 계층 환경을 제공하는 System Virtual Machine이며, IBM VM/730, VirtualBox, Xen, Docker들이 그 예입니다.

System VM은 사용자들에게 전체 컴퓨터를 혼자 쓰고 있다는 환상을 제공합니다. VM을 제공하는 소프트웨어를 VMM(Virtual Machine Monitor) 혹은 Hypervisor라고 부르는데 본 포스팅에서는 VMM이라고 부르겠습니다. VMM은 Virtual Resource를 어떻게 Physical Resource로 사상할 것인지를 결정합니다. 이는 컴퓨팅 자원을 어떻게 분배할 것인지를 의미하죠. 여기서 Physical Resource라고 하면 time-shared 혹은 partitioned로 공유되며 소프트웨어로 에뮬레이션 되기도 합니다.

**이어서 작성 예정입니다...**