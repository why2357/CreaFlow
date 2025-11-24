import i18n from '@/lang/index';

/**
 * 传入验证规则，得到验证结果
 *  @param {RuleItem} ruleObj { label, value, rules, conditions}
 *  @param {String} label: 验证的字段名称
 *  @param {String} value: 验证的值 (验证重复的时候可以添加value1属性)
 *  @param {Array} rules: 验证的规则数组 例如： ['notnull', 'length'] 如果参数必填，第一个参数为notnull
 *  @param {Array} conditions: 条件字段 例如： ['2', '10'] ,则验证长度错误会提示: 密码的长度在2到10个字符,以传入数组的条件去做验证, 验证的提示{1}开始将匹配的是当前数组
 *  @return {obj} { result, message } 验证结果对象
 *  validFn: 返回值为true表示验证通过
 */
export interface RuleItem {
  label: string;
  value?: string | number;
  rules: string[];
  conditions?: number[];
}
export interface RuleRes {
  result: boolean;
  message: string;
}

export default (ruleObj: RuleItem) => {
  const validateObj: Record<string, any> = {
    notnull: {
      validFn: (ruleObj: Partial<RuleItem>) => {
        return ruleObj.value || ruleObj.value === 0;
      },
      msg: `${i18n.global.t('paasTask.pleaseEnter')}{0}`
    },
    length: {
      validFn: (ruleObj: Partial<RuleItem>) => {
        if (!ruleObj.value || !ruleObj.conditions) return true;
        return (
          ruleObj.conditions[0] <= ruleObj.value.toString().trim().length &&
          ruleObj.value.toString().trim().length <= ruleObj.conditions[1]
        );
      },
      msg: '{0}的长度在 {1} 到 {2} 个字符'
    },
    max: {
      validFn: (ruleObj: Partial<RuleItem>) => {
        if (!ruleObj.value || !ruleObj.conditions) return true;
        return ruleObj.conditions[0] >= ruleObj.value.toString().length;
      },
      msg: '长度最多为 {1} 个字符'
    },
    lenMax: {
      validFn: (ruleObj: Partial<RuleItem>) => {
        if (!ruleObj.value || !ruleObj.conditions) return true;
        return ruleObj.conditions[0] >= ruleObj.value.toString().trim().length;
      },
      msg: '长度最多为 {1} 个字符'
    },
    NumMin: {
      validFn: (ruleObj: Partial<RuleItem>) => {
        if (!ruleObj.conditions) return true;
        return Number(ruleObj.value || 0) >= ruleObj.conditions[0];
      },
      msg: '{0}最小为{1} '
    },
    NumRange: {
      validFn: (ruleObj: Partial<RuleItem>) => {
        if (!ruleObj.conditions || ruleObj.value === undefined) return true;
        return ruleObj.conditions[0] <= Number(ruleObj.value) && Number(ruleObj.value) <= ruleObj.conditions[1];
      },
      msg: '{0}的范围在 {1} 到 {2} 之间'
    },
    moblie: {
      validFn: (ruleObj: Partial<RuleItem>) => {
        if (!ruleObj.value) return true;
        const reg = /^1[3-9]\d{9}$/;
        return reg.test(ruleObj.value.toString());
      },
      msg: '{0}请填写正确的手机号'
    },
    number: {
      validFn: (ruleObj: Partial<RuleItem>) => {
        if (!ruleObj.value) return true;
        const reg = /^[0-9]*\.?[0-9]*$/;
        return reg.test(ruleObj.value.toString());
      },
      msg: '{0}只能是数字'
    },
    positiveNumber: {
      validFn: (ruleObj: Partial<RuleItem>) => {
        if (!ruleObj.value) return true;
        const reg = /^\+?[0-9]\d*$/;
        // 正整数
        return reg.test(ruleObj.value.toString());
      },
      msg: '{0}只能是正整数'
    },
    space: {
      validFn: (ruleObj: Partial<RuleItem>) => {
        if (!ruleObj.value) return true;
        const reg = ruleObj.value.toString().split(' ');
        // 正整数
        return !(reg.length > 1);
      },
      msg: '请不要包含空格'
    },
    decimalsTwo: {
      validFn: (ruleObj: Partial<RuleItem>) => {
        if (!ruleObj.value) return true;
        const reg = /^\d{1,14}(\.\d{1,2})?$/;
        return reg.test(ruleObj.value.toString());
      },
      msg: '只能是数字，最多包含两位小数'
    },
    noEmoji: {
      validFn: (ruleObj: Partial<RuleItem>) => {
        if (!ruleObj.value) return true;
        const reg =
          // eslint-disable-next-line no-misleading-character-class
          /[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF][\u200D|\uFE0F]|[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF]|[0-9|*|#]\uFE0F\u20E3|[0-9|#]\u20E3|[\u203C-\u3299]\uFE0F\u200D|[\u203C-\u3299]\uFE0F|[\u2122-\u2B55]|\u303D|[\A9|\AE]\u3030|\uA9|\uAE|\u3030/gi;
        return !reg.test(ruleObj.value.toString());
      },
      msg: '不能输入emoji表情'
    }
  };
  const checkResult: (ruleObj: RuleItem) => RuleRes = () => {
    let result = true;
    let message = '验证成功';
    let ruleName = '';

    // 循环验证
    for (let i = 0, len = ruleObj.rules.length; i < len; i++) {
      ruleName = ruleObj.rules[i];
      // 当验证的规则不存在，默认跳过这个验证
      if (!validateObj[ruleName]) {
        console.log(ruleName + '规则不存在');
        break;
      }
      // 得到当前验证失败信息
      if (!validateObj[ruleName].validFn(ruleObj)) {
        result = false;
        break;
      }
    }
    // 如果验证失败, 得到验证失败的结果集
    if (!result) {
      message = validateObj[ruleName].msg;
      if (ruleObj.conditions) {
        ruleObj.conditions.forEach((item, index: number) => {
          message = message.replace('{' + (index + 1) + '}', item.toString());
        });
      }
      message = message.replace('{0}', ruleObj.label);
      return { result, message };
    }
    return { result, message };
  };
  return checkResult(ruleObj);
};
