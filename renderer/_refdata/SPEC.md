# 诊断标准抽取规范（ICD-11 / CCMD-3）

本目录存放从两份手册抽取的结构化数据，最终会由 bundler 合并成
`ref-icd11.js`（`window.REF_ICD11`）与 `ref-ccmd3.js`（`window.REF_CCMD3`）。

## 一、抽取目标

从 `icd11_full.txt` 与
`ccmd3_full.txt` 中，把**每一个障碍**的诊断标准
完整、逐字抽取出来，输出为合法 JSON 文件。**不得遗漏任何一个障碍，不得自行概括或
省略诊断标准的原文。**

## 二、输出文件与路径

- ICD-11 每个 chunk 输出：`renderer/_refdata/icd11-<chunk>.json`
- CCMD-3 每个 chunk 输出：`renderer/_refdata/ccmd3-<chunk>.json`

必须是**合法 JSON**（UTF-8，无 BOM）。写完必须用
`node -e "JSON.parse(require('fs').readFileSync('<path>','utf8'))"` 自检通过。

## 三、ICD-11 JSON 结构

```json
{
  "system": "icd11",
  "disorders": [
    {
      "code": "6A70",
      "name": "Single episode depressive disorder",
      "nameZh": "单次发作抑郁障碍",
      "block": "Mood disorders",
      "blockZh": "心境障碍",
      "sections": [
        {"head": "Essential (required) features", "headZh": "必须（核心）特征", "en": "...英文原文...", "zh": "...中文译文..."},
        {"head": "Additional clinical features", "headZh": "其他临床特征", "en": "...", "zh": "..."},
        {"head": "Boundary with normality", "headZh": "与正常的界限", "en": "...", "zh": "..."},
        {"head": "Boundaries with other disorders", "headZh": "与其他障碍的鉴别", "en": "...", "zh": "..."}
      ]
    }
  ]
}
```

注：`block`/`blockZh` 放在每个 disorder 上（不是文件级），这样一个 JSON 文件可含多个块。

规则：
- 每个障碍抽取这四个小节（原文中有的就抽，没有的小节省略）：
  **Essential (required) features / Additional clinical features /
  Boundary with normality / Boundaries with other disorders and conditions**。
- `en` 必须是手册**英文原文逐字**（段落合并不改词）；`zh` 是忠实中文译文。
- `nameZh` 用标准中文病名（见术语表）；`code` 保留原文编码（如 6B00、6D10.0、8A05.00）。
- 若某小节下有「developmental presentations / culture-related / sex/gender-related」
  等，只把它们作为该小节正文的一部分保留在 `en`/`zh` 里，不单列小节。
- 若一个编码下有多个「specifier」段落（如 6A20 的 course specifiers、6D10 的
  严重度分级），作为正文保留在对应小节内，不要省略。

## 四、CCMD-3 JSON 结构

```json
{
  "system": "ccmd3",
  "disorders": [
    {
      "code": "32.3",
      "name": "抑郁发作",
      "nameEn": "Depressive episode",
      "block": "3 心境障碍（情感性精神障碍）",
      "blockEn": "Mood (affective) disorders",
      "criteria": [
        {"section": "症状标准", "text": "...原文..."},
        {"section": "严重标准", "text": "..."},
        {"section": "病程标准", "text": "..."},
        {"section": "排除标准", "text": "..."}
      ]
    }
  ]
}
```

规则：
- 只抽取「CCMD-3 精神障碍的诊断标准」正文部分（从「0 器质性精神障碍」开始），
  不含引言/分类列表/附录英文译文/现场测试。
- 每个障碍（含亚型）抽齐其 `[诊断标准]` 下的 **症状标准 / 严重标准 / 病程标准 /
  排除标准** 四段（原文有的都抽，没有的省略）。若某障碍标准是叙述式而非四段式，
  则用单个 section（section 名取「诊断标准」）保存全文。
- `code` 用原文编号（如 20、32.3、41.1）；`name` 中文名、`nameEn` 英文名（手册括号内
  给的英文名，没有则省略 nameEn）。
- 编码层级：父类（如「32 心境障碍」）下常有子类（如「32.3 抑郁发作」），
  **每个有独立诊断标准的都单列为一个 disorder**。

## 五、译文术语表（ICD-11 中译必须统一）

- Essential (required) features → 必须（核心）特征
- Additional clinical features → 其他临床特征
- Boundary with normality → 与正常的界限
- Boundaries with other disorders and conditions → 与其他障碍及状况的界限（鉴别）
- clinically significant distress or impairment → 有临床意义的痛苦或功能损害
- reality testing → 现实检验能力；impaired reality testing → 现实检验能力受损
- delusion → 妄想；hallucination → 幻觉；formal thought disorder → 形式思维障碍
- disorganized behaviour/speech → 瓦解的行为/言语；negative symptoms → 阴性症状
- depressed mood → 抑郁心境；anhedonia → 快感缺失；fatigue/loss of energy → 疲劳/精力减退
- manic episode → 躁狂发作；hypomanic → 轻躁狂；elevated/expansive/irritable mood → 高涨/夸大/易激惹心境
- anxiety → 焦虑；worry → 担忧/忧虑；panic attack → 惊恐发作
- agoraphobia → 广场恐惧；social anxiety disorder → 社交焦虑障碍；specific phobia → 特定恐惧症
- obsession → 强迫观念；compulsion → 强迫行为；body dysmorphic → 躯体变形
- intrusive → 闯入性；avoidance → 回避；hypervigilance → 警觉性增高
- flashback → 闪回；nightmare → 噩梦；dissociative → 分离（解离）性
- depersonalization → 人格解体；derealization → 现实解体；amnesia → 遗忘
- anorexia nervosa → 神经性厌食；bulimia nervosa → 神经性贪食；binge-eating → 暴食
- substance use → 物质使用；dependence → 依赖；intoxication → 中毒；withdrawal → 戒断
- psychotic → 精神病性；psychotic disorder → 精神病性障碍
- personality disorder → 人格障碍；personality trait → 人格特质
- neurocognitive disorder → 神经认知障碍；dementia → 痴呆；delirium → 谵妄
- attention deficit hyperactivity disorder → 注意缺陷多动障碍
- autism spectrum disorder → 自闭症谱系障碍
- intellectual disability/development → 智力发育障碍
- somatic → 躯体；distress → 痛苦；impairment → 功能损害
- 常见病名：Schizophrenia→精神分裂症；Schizoaffective→分裂情感性障碍；
  Schizotypal→分裂型（障碍）；Delusional disorder→妄想性障碍；
  Bipolar type I→双相Ⅰ型障碍；Bipolar type II→双相Ⅱ型障碍；
  Cyclothymic→环性心境障碍；Dysthymic→恶劣心境障碍；
  Generalized anxiety disorder→广泛性焦虑障碍；Panic disorder→惊恐障碍；
  OCD→强迫症；PTSD→创伤后应激障碍；Complex PTSD→复杂性创伤后应激障碍；
  Prolonged grief disorder→延长哀伤障碍；Adjustment disorder→适应障碍；
  Dissociative identity disorder→分离性身份障碍；
  Bodily distress disorder→躯体痛苦障碍；Hypochondriasis→疑病症（健康焦虑障碍）；
  Hoarding disorder→囤积障碍；Gambling disorder→赌博障碍；Gaming disorder→游戏障碍；
  Oppositional defiant disorder→对立违抗障碍；Conduct-dissocial disorder→品行-反社会性障碍；
  Pyromania→纵火狂；Kleptomania→偷窃癖；Intermittent explosive disorder→间歇性暴怒障碍；
  Exhibitionistic disorder→露阴障碍；Voyeuristic disorder→窥阴障碍；
  Paedophilic disorder→恋童障碍；Factitious disorder→做作性障碍；
  Delirium→谵妄；Enuresis→遗尿症；Encopresis→遗粪症。

## 六、完成标准

1. 输出 JSON 通过 `node -e "JSON.parse(...)"` 自检。
2. 报告：本 chunk 抽取的障碍数量、每个障碍的 code 列表；与任务给出的 code 清单逐一比对，
   若有遗漏必须在最终报告中明确说明原因（原文确实缺失/合并等）。
3. 报告最终必须只包含：障碍总数、code 清单、自检结果、遗漏说明（如有）。
