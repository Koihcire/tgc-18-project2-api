function getPriorOne (){
    const now = new Date()
    const temp = new Date(now).setMonth(now.getMonth() - 1);
    const priorOne = new Date(temp)
    return priorOne;
} module.exports = {getPriorOne}