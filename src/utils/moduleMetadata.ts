const metadataMap: Record<string, { title: string; purpose: string }> = {
  profile: {
    title: "AI 的角色与基本原则",
    purpose: "定义 AI 的角色定位、知识边界、回答依据，以及草稿输出这一类核心工作原则。",
  },
  specification: {
    title: "回答规范",
    purpose: "规定回答时必须遵守的表达要求、证据引用方式、医学术语规范和风险控制要求。",
  },
  domain_vocabulary: {
    title: "术语与领域词汇",
    purpose: "沉淀治疗领域内的专有名词、术语翻译或表达口径，帮助统一回答语言。",
  },
  indication: {
    title: "适应症信息",
    purpose: "列出当前问题相关的适应症范围，帮助业务用户快速理解回答适用的疾病场景。",
  },
  reference_level: {
    title: "证据优先级",
    purpose: "定义不同问题类型下的引用优先级，确保回答优先采用更高等级的证据。",
  },
  common_business_rules: {
    title: "通用业务规则",
    purpose: "沉淀跨场景通用的业务限制和表述规范，用于控制风险并统一回复口径。",
  },
  specific_rules: {
    title: "特定业务规则",
    purpose: "补充某些疾病、药物或专题下的特殊要求，帮助团队识别高优先级特殊情形。",
  },
  response_architecture: {
    title: "输出结构",
    purpose: "规定草稿和最终答案的组织方式，说明如何把证据整理成结构化回复。",
  },
  example: {
    title: "示例问答",
    purpose: "通过示例演示 Prompt 的执行方式、输出结构和证据引用习惯，便于业务同事理解。",
  },
  related_documents: {
    title: "文档输入",
    purpose: "说明模型可引用的文档来源，帮助用户理解回答将依据哪些输入材料展开。",
  },
  query: {
    title: "用户问题",
    purpose: "定义最终传给模型的用户问题和补充要求，是触发回答生成的输入入口。",
  },
  source_scope: {
    title: "引用范围",
    purpose: "限定可引用的文档 ID 范围，防止回答超出已提供材料或自行编造来源。",
  },
};

export function getModuleMetadata(tagName: string) {
  return (
    metadataMap[tagName] ?? {
      title: `其他模块（<${tagName}>）`,
      purpose: "这是一个未预设映射的模块，系统会保留原始结构并提供业务友好型阅读展示。",
    }
  );
}
