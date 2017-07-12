import math

bigR = 360 ## radius of entire plot
c = 10 ## number of emotion categories
t = 4 ## number of intensity levels per category (minus 1)
p = 0.75 ## proportion of (circle / next biggest circle)
g = 0.01 ## gap between category sectors [(gap size) / (circle size * c)]
s = 25 ## space between same intensity levels
q = 0.75 ## percentage larger (or smaller) than outside radius that center is

#PROPORTION BASED space definition (experimental)
# s = 0.2 ## space between same intensity levels as percent of radius
# denom = summa1 + s*t + s + 1
# r2 = bigR / denom
# from summa4
#       result += rs * (l-1)
# from for n in range(0, c+1)
#       from elif l == 1
#           thisZ = 2*r + s*r + (r*p)


summa1 = 0
for i in range(0, t+1):
    summa1 += 2 * p**i

#theta = (2 * math.pi) / (c * (1 + g))
#r1 = (bigR * math.sin(theta)) / (1 + math.sin(theta))
r = ((bigR - (s*t) - s) / (summa1 + (1+q)))
#r = min(r1, r2)

allPoints = [] ## list of lists, where each entry is a point such that i=0 is radius, i=1 is x pos, i=2 is y pos

def summa4(l):
    # sum of:
    # summation, from i = 0 to i = l-2, of [r * (p^i)]
    # s * (l-1)
    # r * p^(l-1)
    result = 0
    for i in range(0, l+1):
        term = r * (p**i)
        result += (term*2)
    result += s * (l-1)
    result += p**(l-1)
    return result

#start new
precision = 0.05  # increments of percentage to decrease radius by while checking
precision2 = 0.05 # increments of percentage to decrease space by while checking
def distanceForm(x1, y1, x2, y2):
    underRadical = (x2 - x1)**2 + (y2 - y1)**2
    result = underRadical**(0.5)
    return result
def checkDistance(dist, layer, inc):
    origRad = r * (p **(l))
    radMultiplier = 1 - (inc*precision)

    layerCircum = 0
    if layer == 0:
        layerCircum = 2 * math.pi * (bigR - r)
    else:
        layerCircum = 2 * math.pi * (bigR - summa4(l) - r)
    gap = g * layerCircum
    needSpace = 2 * origRad * radMultiplier + gap

    if dist >= needSpace:
        return True
    else:
        return False
def checkDistance2(x1, y1, x2, y2, layer, inc):
    outerRad = r * (p ** l)
    innerRad = r * (p ** (l+1))

    spacePad = 0.1 # allowable percentage of extra space
    maxSpace = outerRad + (s * (1+spacePad)) + innerRad

    dist = distanceForm(x1, y1, x2, y2) * (1 - (inc*precision2))

    if dist <= maxSpace:
        return True
    else:
        return False

# initialize list with manually set scale variables as 0
manSclRad = []
manSclSpc = []
for n in range(0, t+1):
    manSclRad.insert(n, 1)
    manSclSpc.insert(n, 1)
# test distances to check over-spacing
for l in range(0, t+1):
    outerRad = r * (p ** l)
    innerRad = r * (p ** (l+1))
    outZ = summa4(l) + r
    inZ = summa4(l+1) + r
    if l == 0:
        outZ = r + s
    outLength = bigR - outZ
    inLength = bigR - inZ
    trigVal = (2 * math.pi) / c
    outX = outLength * math.cos(trigVal)
    outY = outLength * math.sin(trigVal)
    inX = inLength * math.cos(trigVal)
    inY = inLength * math.sin(trigVal)

    #emulate do-while loop
    condition = True
    increments = 0
    while condition:
        eval = checkDistance2(outX, outY, inX, inY, l, increments)
        if eval:
            condition = False
        else:
            increments += 1
    finalValue = 1 - (increments * precision2)
    manSclSpc[l] = finalValue
# test distances to check overlap
for l in range(0, t+1):
    origRad = r * (p **(l*1.2))
    thisZ = summa4(l) + r
    if l == 0:
        thisZ = r + s
    thisLength = bigR - thisZ
    thisX = thisLength * manSclSpc[l]
    thisY = 0
    trigVal2 = (2 * math.pi) / c
    thisX2 = thisLength * math.cos(trigVal2) * manSclSpc[l]
    thisY2 = thisLength * math.sin(trigVal2) * manSclSpc[l]

    #emulate do-while loop
    condition = True
    increments = 0
    while condition:
        distance = distanceForm(thisX, thisY, thisX2, thisY2)
        eval = checkDistance(distance, l, increments)
        if eval:
            condition = False
        else:
            increments += 1
    finalValue = 1 - (increments * precision)
    manSclRad[l] = finalValue

#end new

for n in range(0, c+1):
    for l in range(0, t+1):
        thisRad = r * (p ** (l*1.2)) * manSclRad[l]
        thisZ = summa4(l) + (r)
        if l == 0:
            thisZ = r
        thisLength = bigR - thisZ
        trigVal = ((2 * math.pi) / c) * n
        thisX = thisLength * math.cos(trigVal) * manSclSpc[l]
        thisY = thisLength * math.sin(trigVal) * manSclSpc[l]
        thisRadR = round(thisRad, 3)
        thisXR = round(thisX, 3)
        thisYR = round(thisY, 3)
        allPoints.append([thisRadR, thisXR, thisYR])

matrixCentersBuild1 = "["
for i in range(0, len(allPoints)-10):
    matrixCentersBuild1 += str(allPoints[i][1]) + " " + str(allPoints[i][2]) + "; "
matrixCentersBuild2 = ""
for i in range(len(allPoints)-10, len(allPoints)):
    matrixCentersBuild2 += str(allPoints[i][1]) + " " + str(allPoints[i][2]) + "; "
matrixCentersBuild2 += "]"
print "Matrix for centers:"
print matrixCentersBuild1
print matrixCentersBuild2

matrixRadiiBuild1 = "["
for i in range(0, len(allPoints)-8):
    matrixRadiiBuild1 += str(allPoints[i][0]) + "; "
matrixRadiiBuild2 = ""
for i in range(len(allPoints)-8, len(allPoints)):
    matrixRadiiBuild2 += str(allPoints[i][0]) + "; "
matrixRadiiBuild2 += "]"
print "Matrix for radii:"
print matrixRadiiBuild1
print matrixRadiiBuild2


