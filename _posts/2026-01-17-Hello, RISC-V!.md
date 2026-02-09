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
draft: true
---
##  Introduce

2000년대 초반까지는 하드웨어가 알아서 빨라지던 시대였습니다. 단일 코어 성능이 매년 비약적으로 늘어난 덕분에 소프트웨어 개발자들은 굳이 최적화에 목을 매지 않아도 성능 향상의 이점을 누릴 수 있었습니다.

하지만 2003년경, 발열과 전력 소모, 그리고 ILP(명령어 수준 병렬성)가 한계에 부딪히며 이러한 흐름은 정체되었습니다. 제조사들은 클럭 주파수를 높이는 대신 멀티코어로 선회했고, 이때부터 성능을 제대로 뽑아내기 위해 병렬 프로그래밍과 컴퓨터 구조에 대한 깊은 이해는 필수 역량이 되었습니다.

**그렇다면 왜 수많은 아키텍처 중 하필 RISC-V일까요?**

일단 X86-64는 제외했습니다. uops가 있다곤 하지만 시작부터 너무 비대한 아키텍쳐를 공부하면 제대로 소화하지 못할 것 같았습니다.

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
>x86-64 아키텍처는 가변길이 명령어의 고질적인 Decoding 병목&전력 소모를 해결하기 위해, 한 번 변환된 명령어 조각들을 `uOp Cache`에 저장합니다. 이는 파이프라이닝, 비순차 실행(Out-of-Order), 슈퍼스칼라 구조를 RISC-V와 유사한 수준의 효율로 구현할 수 있게 만들어주지만 `uOps`에서 발생하는 물리적인 전력 낭비와 추가적인 Latency 문제에서 자유롭지 못하고, 이 점은 x86 아키텍쳐 대비 RISC 아키텍쳐가 가지는 매우 중요한 장점입니다.

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
위 `Hazard Detection Unit`은 `CC 3`에 작동하며 조건이 만족되면 명령어는 1 clock cycle만큼 징ㄴ된다. 1 clock cycle stall 후에는 `Fowarding Unit`이 종속성을 처리할 수 있어 실행은 계속 진행되며, 만약 `Fowarding Unit`이 없으면 1Cycle 더 Stall됩니다.

위 로직을 적용한 Data Hazard는 아래 그림과 같게 됩니다.

![Multieple clock cycle pipeline diagrams](/assets/post/2026-01-17-Hello,-RISC-V!/data_hazard_single_clock_cycle_pipeline_diagrams.png)
### Control Hazard

파이프라인이 계속 일하기 위해서는 매 클럭마다 명령어가 `fetch`되어야 하는데, 지금의 설계대로라면 `branch`에 대한 결정이 `MEM`단계에 이루어집니다. 이렇게 `fetch`할 명령어를 결정하는 일이 늦어지는 현상을 `Control Hazard`라고 합니다.



#### Static Branch Prediction
{: .prompt-info}
>Instruction fetch delay를 의미한다. Data Hazard만큼 자주 일어나지 않지만, Data Hazard의 Fowarding 같은 완벽한 해결책이 없기 때문에 복잡합니다.


{: .prompt-tip}
>시각화 팁
>![Multieple clock cycle pipeline diagrams](/assets/post/2026-01-17-Hello,-RISC-V!/miltiple_clock_cycle_pipeline_diagrams.png)
>**1. Multieple clock cycle pipeline diagrams:** 시간 흐름에 따른 명령어 간의 실행 순서와 Hazard/Stall 발생 여부를 한눈에 파악할 때 사용합니다.
>
>**2. single clock cycle pipeline diagrams:** 특정 순간의 Datapath 세부 상태와 Control Signal이 올바르게 작동하는지 정밀하게 분석할 때 사용합니다.


#### Ddynamic Branch Prediction

1. branch prediction buffer를 이용: 분기 명령어 주소의 하위 비트에 의해 인덱스되는 작은 메모리. 최근 분기가 일어났는지 그렇지 않은지를 나타내는 비트(1bit, 2bit)를 가지고있음. 그렇지만 여러 딜레마를 가지고있음
	1. 이를 해결하기 위해 correlating predictor, tournament predictor이 존재. correlating predictor는 2개의 2bit predocctor를 사용하는데 직전에 실행된 분기 명령어가 분기를 했냐 안했냐에 따라 두 예측기 중 하나를 선택한다.
	2. tournament predictor는 각각의 분기에 대해 다수의 예측기를 사용하여 어떤 예측기가 가장 좋은 결과를 내는지 추적하는 예측기이다
	- Conditional move로도 조건부 분기 명령어를 줄일 수 있다. RISC-V에는 2023년에 'Zicond'라는 표준 확장이 비준되었다.

#### Exception

제어에서 가장 어려운 부분이 `Exception/Interrupt` 구현이라고 합니다. 실제로는 아래 표와 같이 굉장히 다양한 예외가 존재하는데요, 포스팅에서는 정의 안된 명령어의 실행과 하드웨어의 오작동으로 발생하는 예외만 다루겠습니다.

그리고 포스팅에서는 원인이 내부에 있건 외부에 있건 구별 없이 제어 흐름에서의 예기치 못한 변화를 지칭할 때 `Exception`이라 지칭하고, 사건이 외부적인 요인으로 일어날 경우에만 `Interrupt`용어를 사용하겠습니다.

| **분류 (명칭)**                            | **발생 원인 (Trigger)**                                               | **대표적인 실제 사례**                                           |
| -------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- |
| **Interrupt**<br>(Timer Interrupt)     | `mtime` 레지스터 값이 `mtimecmp` 값보다<br>크거나 같을 때                        | OS 스케줄러가 멀티태스킹을 위해 현재<br>프로세스를 중단하고 Context Switch 하는 경우 |
| **Interrupt**<br>(External Interrupt)  | PLIC(Platform-Level Interrupt Controller)<br>를 통해 외부 장치 신호가 들어올 때 | 키보드 입력, 네트워크 패킷 도착 등<br>주변 장치가 처리를 요청할 때                 |
| **Exception**<br>(Environment Call)    | `ECALL` 명령어 실행                                                    | 사용자 프로그램이 OS 커널(시스템 콜)을<br>호출할 때                         |
| **Exception**<br>(Page Fault)          | 가상 메모리 변환(Virtual Address Translation)<br>실패 또는 권한 위반 시           | 메모리에 로드되지 않은 페이지에 접근하거나<br>(Swap) 읽기 전용 페이지에 쓰기를 시도할 때   |
| **Exception**<br>(Illegal Instruction) | 디코더가 알 수 없는 Opcode를 만났거나,<br>권한 없는 CSR에 접근할 때                     | 지원하지 않는 확장 명령어를 실행하거나,<br>손상된 바이너리를 실행할 때                |

프로세서의 예외 처리 과정은 사람의 대처 방식과 크게 다르지 않습니다. CPU가 `Exception`이나 `Interrupt`를 감지하면, 즉시 문제가 발생한 명령어의 주소를 SEPC(Supervisor Exception Program Counter) 레지스터에 저장하고, 그 원인을 SCAUSE(Supervisor Exception Cause) 레지스터에 기록합니다.

그 후 하드웨어는 PC 값을 미리 지정된 예외 처리 주소(예: `1C09 0000`)로 덮어써서 제어권을 운영체제로 넘깁니다. 바통을 이어받은 운영체제는 SCAUSE를 확인해 상황을 `Trap`, `Fault`, `Abort` 으로 분류하고, 시스템 콜 같은 서비스를 제공하거나 오류를 보고하고 프로그램을 종료하는 등 적절한 조치를 취합니다. 만약 실행을 재개하기로 결정했다면, 저장해 둔 SEPC 값을 참조하여 다시 실행할 위치로 복귀합니다.

![datapath_with_controls_to_handle_exceptions](/assets/post/2026-01-17-Hello,-RISC-V!/datapath_with_controls_to_handle_exceptions.png)

### Parallelism
#### ILP(명령어 수준 병렬성)


## Memory Hierarchy

메모리 계층 구조는 제한된 비용 내에서, 사용자에게 가장 빠른 메모리의 접근 속도와 충분한 용량을 동시에 제공하는 것을 목표로 합니다.

그러한 최적화를 위한 모든 기술에는 **Principle of Locality**가 적용됩니다.

1. **Temporal Locality(시간적 지역성) :** 한번 참조된 항목은 곧바로 다시 참조되는 경향
2. **Spatial Locality(공간적 지역성) :** 어떤 항목이 참조되면 그 근처에 있는 다른 항목들이 곧바로 참조될 가능성이 높다

프로그램에서의 지역성은 단순하고도 자연스러운 프로그램 구조에서 나오는데요, 순환문과 순차접근에서 이와 같은 특성을 볼 수 있습니다. 이러한 특성들을 잘 살려 성능을 최적화 하기 위해 현대 메모리 시스템은 Hierarchy(계층구조)를 사용합니다.

메모리 계층구조는 여러 계층으로 구성되지만, 데이터는 인접한 두 계층 사이에서만 한 번에 복사됩니다. 이 두 계층 간 정보 전송의 최소 단위를 **Block/Line**이라고 부릅니다. 그리고 프로세서가 요구한 데이터가 상위 계층의 어떤 블록에 있을 때 이를 **Hit** 이라고 부릅니다. 그리고 상위 계층에서 찾을 수 없다면 **Miss**라고 부르죠. 위 표현들은 자주 사용되니 반드시 알고있어야 합니다. 

### Cache Architecture

#### SRAM
하드웨어의 물리적 구현 방식에 대해서 꼭 알아야 하는 것은 아니지만, 알아두면 참 좋습니다. Cache Architecture의 대부분을 담당하는 SRAM의 Memory chip 구조는 아래와 같습니다.


![memory_chipt_structure](/assets/post/2026-01-17-Hello,-RISC-V!/memory_chipt_structure.png)
위 그림에서와 같이, RAM(Random Acess Memory)은 WL과 BL을 통해 원하는 주소값에 해당하는 Cell에 접근할 수 있습니다. 

Word Line(WL)과 Bit Line(BL)이 교차 인가되는 Selected Cell에서 저장하는 Bit 크기 에 따라 SLC(Single Level Cell), MLC(Multie Level Cell)로 구분할 수 있는데, 본 포스팅에서는 SRAM이 SLC라고 가정하겠습니다.

![SRAM_cell](/assets/post/2026-01-17-Hello,-RISC-V!/6transistor_cmos_sram_cell.jpg)

먼저 SRAM에 대해 쉽게 이해해보자면 `INV` 두개가 맞물린 구조입니다. `Q`라는 노드에 `0`이 저장되어있으면 `INV`를 통해 `/Q`의 값은 `1`로 계속해서 유지됩니다. 따라서 `Q`와 `/Q`의 순환에 의해 데이터가 바뀌지 않고 안정적으로 유지되죠. 전력이 공급되는 한 신호의 입력 논리가 유지되는 성질로 인해 전하 누출로 인한  `Refresh`가 필요하지 않기 때문에 Static RAM이라고 불립니다.


#### Basic of Cash
d

#### Optimizing Cache Performance
d

### Virtual Memory
d
### Coherence & Framework
d
