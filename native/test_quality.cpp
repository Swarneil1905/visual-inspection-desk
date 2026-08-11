#include "quality.h"
#include <vector>
#include <cmath>
#include <iostream>
int main(){
 QualityMetrics q{};std::vector<uint8_t> black(32*32*3,0);
 if(image_quality(black.data(),32,32,static_cast<int>(black.size()),&q)||q.brightness!=0||q.sharpness!=0)return 1;
 std::vector<uint8_t> white(32*32*3,255);image_quality(white.data(),32,32,static_cast<int>(white.size()),&q);
 if(std::abs(q.brightness-1)>1e-6||q.sharpness>1e-6)return 2;
 for(int y=0;y<32;y++)for(int x=0;x<32;x++)for(int c=0;c<3;c++)black[(y*32+x)*3+c]=((x+y)%2)*255;
 image_quality(black.data(),32,32,static_cast<int>(black.size()),&q);if(q.sharpness<1000)return 3;
 if(image_quality(nullptr,32,32,3072,&q)==0||image_quality(black.data(),32,32,10,&q)==0)return 4;
 std::cout<<"Native quality checks passed\n";return 0;
}
