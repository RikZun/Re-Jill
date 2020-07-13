import {Message, PermissionString} from 'discord.js'
export {
    print, randint, hyphenation, 
    get, arrayDelValue, range,
    mth, arrayTypeChange, translatePerm,
    botHasPermissions
    }

function print(...data: any[]) {
    data.forEach((val, key, map) =>
        console.log(val))
}

function randint(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function hyphenation(array: string[], limit: number) {
    let rt = '',
        lineLenght = 0

    array.forEach(v => {
        v = `[${v}] `
        if (lineLenght + v.length > limit) {
            rt += '\n' + v
            lineLenght = v.length
            return
        }
        rt += v
        lineLenght += v.length
    })
    return rt || null
}

function get(dict: object, key: string, rt:any = undefined) {
    return dict?.[key] ?? rt
}

function arrayDelValue(array: Array<any>, value: string) {
    const index = array.indexOf(value)
    array.splice(index, 1)
    return array
}

function range(min: number, max: number) {
    return Array.apply(0, Array(max))
        .map((element, index) => index + min);
}

function mth(a: number, operator: string, b: number): number {
    if (!a || !operator || !b) return undefined;
    switch (operator) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
        default: return undefined
    }
}
function arrayTypeChange(array: Array<any>, type: any) {
    array.forEach((e, i, a) => {
        array[i] = type(e)
    });
}

function translatePerm(arr: string[], message: string) {
    const dictionary = {
        'ADMINISTRATOR': 'Администратор',
        'MANAGE_CHANNELS': 'Управлять каналами',
        'MANAGE_GUILD': 'Управлять сервером'
    }
    arr.forEach(element => {
        message += `\n\`${dictionary[element]}\``
    })
    return message
}

function botHasPermissions(message: Message, perms: PermissionString[]) {
    if (message.guild.me.hasPermission(perms)) return true;
    return translatePerm(perms, 'Боту требуются права:')
}